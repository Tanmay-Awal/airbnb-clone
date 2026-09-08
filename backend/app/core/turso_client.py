"""
DBAPI 2.0 driver wrapper over Turso Cloud HTTP / Pipeline REST API.
Enables SQLAlchemy to query remote Turso database over HTTPS with connection pooling & statement batching.
"""
import requests
from urllib.parse import urlparse

paramstyle = "qmark"

# Global HTTP Session for Connection Pooling & TCP/TLS Keep-Alive
_http_session = requests.Session()
_adapter = requests.adapters.HTTPAdapter(pool_connections=50, pool_maxsize=50, max_retries=3)
_http_session.mount("https://", _adapter)
_http_session.mount("http://", _adapter)

_connection_cache = {}

def connect(url: str, auth_token: str):
    cache_key = f"{url}:{auth_token}"
    if cache_key not in _connection_cache:
        _connection_cache[cache_key] = TursoConnection(url, auth_token)
    return _connection_cache[cache_key]

class TursoConnection:
    def __init__(self, url: str, auth_token: str):
        if url.startswith("sqlite+libsql://"):
            url = url.replace("sqlite+libsql://", "https://")
        elif url.startswith("libsql://"):
            url = url.replace("libsql://", "https://")
        
        parsed = urlparse(url)
        self.endpoint = f"https://{parsed.netloc}/v2/pipeline"
        self.headers = {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }

    def cursor(self):
        return TursoCursor(self)

    def create_function(self, *args, **kwargs):
        pass

    def commit(self):
        pass

    def rollback(self):
        pass

    def close(self):
        pass

class TursoCursor:
    def __init__(self, connection: TursoConnection):
        self.conn = connection
        self.description = None
        self.rowcount = -1
        self.lastrowid = None
        self._rows = []

    def _format_parameters(self, parameters):
        if not parameters:
            return None
        formatted_args = []
        for p in parameters:
            if p is None:
                formatted_args.append({"type": "null"})
            elif isinstance(p, bool):
                formatted_args.append({"type": "integer", "value": "1" if p else "0"})
            elif isinstance(p, int):
                formatted_args.append({"type": "integer", "value": str(p)})
            elif isinstance(p, float):
                formatted_args.append({"type": "float", "value": p})
            else:
                formatted_args.append({"type": "text", "value": str(p)})
        return formatted_args

    def execute(self, sql: str, parameters=None):
        import time
        stmt = {"sql": sql}
        args = self._format_parameters(parameters)
        if args:
            stmt["args"] = args

        payload = {"requests": [{"type": "execute", "stmt": stmt}]}
        t0 = time.perf_counter()
        res = _http_session.post(self.conn.endpoint, json=payload, headers=self.conn.headers, timeout=15)
        t_dur_ms = round((time.perf_counter() - t0) * 1000, 2)
        if t_dur_ms > 100:
            print(f"☁️ [TURSO CLOUD HTTP {t_dur_ms}ms] {sql[:100]}...", flush=True)
        
        if res.status_code != 200:
            raise Exception(f"Turso HTTP API Error {res.status_code}: {res.text}")

        data = res.json()
        result = data["results"][0]["response"]["result"]
        
        cols = result.get("cols", [])
        self.description = [(c["name"], None, None, None, None, None, None) for c in cols]
        
        self._rows = []
        for row in result.get("rows", []):
            parsed_row = []
            for item in row:
                t = item.get("type")
                val = item.get("value")
                if t == "null" or val is None:
                    parsed_row.append(None)
                elif t == "integer":
                    parsed_row.append(int(val))
                elif t == "float":
                    parsed_row.append(float(val))
                else:
                    parsed_row.append(val)
            self._rows.append(tuple(parsed_row))
        
        self.rowcount = result.get("affected_row_count", len(self._rows))
        self.lastrowid = result.get("last_insert_rowid")
        return self

    def executemany(self, sql: str, seq_of_parameters):
        """Batch multiple executions into a single Turso HTTP pipeline request."""
        if not seq_of_parameters:
            return self

        requests_list = []
        for params in seq_of_parameters:
            stmt = {"sql": sql}
            args = self._format_parameters(params)
            if args:
                stmt["args"] = args
            requests_list.append({"type": "execute", "stmt": stmt})

        payload = {"requests": requests_list}
        res = _http_session.post(self.conn.endpoint, json=payload, headers=self.conn.headers, timeout=15)
        if res.status_code != 200:
            raise Exception(f"Turso HTTP API Error {res.status_code}: {res.text}")

        data = res.json()
        if data.get("results"):
            last_res = data["results"][-1]["response"]["result"]
            self.rowcount = sum(r["response"]["result"].get("affected_row_count", 0) for r in data["results"] if "response" in r and "result" in r["response"])
            self.lastrowid = last_res.get("last_insert_rowid")
        return self

    def fetchone(self):
        if not self._rows:
            return None
        return self._rows.pop(0)

    def fetchall(self):
        rows = self._rows
        self._rows = []
        return rows

    def close(self):
        pass

