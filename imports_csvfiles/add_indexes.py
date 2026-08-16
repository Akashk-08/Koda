import psycopg2

DB_CONFIG = {
    "dbname": "koda_db", 
    "user": "koda_user", 
    "password": "koda_password", 
    "host": "localhost", 
    "port": "5434"
}

def create_indexes():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        print("Connected to database. Creating performance indexes...")

        # Create indexes for lightning-fast lookups
        cur.execute('CREATE INDEX IF NOT EXISTS idx_work_orders_org ON work_orders(organization_id);')
        cur.execute('CREATE INDEX IF NOT EXISTS idx_work_orders_status ON work_orders(status);')
        
        conn.commit()
        print("Success! Database indexes created permanently. Your work orders will now load instantly.")
    except Exception as e:
        print(f"Error creating indexes: {e}")
        if 'conn' in locals(): conn.rollback()
    finally:
        if 'cur' in locals(): cur.close()
        if 'conn' in locals(): conn.close()

if __name__ == "__main__":
    create_indexes()