import psycopg2
from contextlib import contextmanager


@contextmanager
def get_db_connection():
    conn = psycopg2.connect(
        host="aws-1-us-east-1.pooler.supabase.com",
        database="postgres",
        user="postgres.sizsjbgvjafluopcrnmx",
        password="MiloyBrandy123!",
        port="5432"
    )

    cursor = conn.cursor()

    try:
        cursor.execute("SET search_path TO sakila, public;")

        yield conn, cursor

        conn.commit()

    except Exception:
        conn.rollback()
        raise

    finally:
        cursor.close()
        conn.close()