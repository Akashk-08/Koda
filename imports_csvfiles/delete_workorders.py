import psycopg2

DB_CONFIG = {
    "dbname": "koda_db", 
    "user": "koda_user", 
    "password": "koda_password", 
    "host": "localhost", 
    "port": "5434"
}

def delete_all_workorders():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        print("Connecting to database...")
        
        cur.execute('TRUNCATE TABLE "work_orders" CASCADE;')
        conn.commit()
        
        
        print("Success! All work orders have been completely deleted.")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        if 'cur' in locals(): cur.close()
        if 'conn' in locals(): conn.close()

if __name__ == "__main__":
    delete_all_workorders()