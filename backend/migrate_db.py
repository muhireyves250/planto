import psycopg2
import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://neondb_owner:npg_JDZW9M4tvnbh@ep-dry-base-ankwllos-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require")

conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

columns = [
    ("farm_name", "VARCHAR(255)"),
    ("primary_phone", "VARCHAR(50)"),
    ("default_soil_type", "VARCHAR(50)"),
    ("irrigation_system", "VARCHAR(50)"),
    ("farm_location", "VARCHAR(255)"),
    ("notify_email", "BOOLEAN DEFAULT TRUE"),
    ("notify_push", "BOOLEAN DEFAULT TRUE"),
    ("notify_sms", "BOOLEAN DEFAULT FALSE"),
]

for col_name, col_type in columns:
    try:
        cur.execute(f"ALTER TABLE users ADD COLUMN {col_name} {col_type};")
        conn.commit()
        print(f"Added {col_name}")
    except Exception as e:
        conn.rollback()
        print(f"Column {col_name} might already exist or error: {e}")

cur.close()
conn.close()
