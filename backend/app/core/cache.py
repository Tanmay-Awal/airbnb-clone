import time
from typing import Dict, Any, Tuple, Optional

class SimpleTTLCache:
    def __init__(self, default_ttl_seconds: int = 15):
        self._cache: Dict[str, Tuple[float, Any]] = {}
        self.default_ttl = default_ttl_seconds

    def get(self, key: str) -> Optional[Any]:
        if key not in self._cache:
            return None
        expires_at, value = self._cache[key]
        if time.time() > expires_at:
            del self._cache[key]
            return None
        return value

    def set(self, key: str, value: Any, ttl_seconds: Optional[int] = None):
        ttl = ttl_seconds if ttl_seconds is not None else self.default_ttl
        self._cache[key] = (time.time() + ttl, value)

    def clear(self, key_prefix: Optional[str] = None):
        if key_prefix is None:
            self._cache.clear()
        else:
            keys_to_del = [k for k in self._cache if k.startswith(key_prefix)]
            for k in keys_to_del:
                del self._cache[k]

ttl_cache = SimpleTTLCache(default_ttl_seconds=30)
