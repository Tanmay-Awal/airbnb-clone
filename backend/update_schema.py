import sqlite3
import os
from app.models.listing import Listing
from app.core.database import engine

db_path = os.path.join(os.path.dirname(__file__), 'airbnb.db')
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

cursor.execute("PRAGMA table_info(listings)")
existing_cols = {row[1] for row in cursor.fetchall()}
print("Existing listings columns:", existing_cols)

# Inspect model columns
for col in Listing.__table__.columns:
    col_name = col.name
    if col_name not in existing_cols:
        col_type = "TEXT"
        if str(col.type).startswith("INTEGER") or str(col.type).startswith("BOOLEAN"):
            col_type = "INTEGER"
        elif str(col.type).startswith("FLOAT"):
            col_type = "REAL"
        elif str(col.type).startswith("DATETIME"):
            col_type = "DATETIME"
        
        print(f"Adding missing column to listings table: {col_name} ({col_type})")
        try:
            cursor.execute(f"ALTER TABLE listings ADD COLUMN {col_name} {col_type}")
        except Exception as e:
            print(f"Error adding {col_name}: {e}")

conn.commit()
conn.close()
print("Complete DB schema sync finished successfully!")
