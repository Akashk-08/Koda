import csv
import psycopg2
import uuid
import bcrypt

DB_CONFIG = {
    "dbname": "koda_db", 
    "user": "koda_user", 
    "password": "koda_password", 
    "host": "localhost", 
    "port": "5434"
}

DEFAULT_ORG_ID = "b263d052-265f-4da1-82c6-4706a7de9955"

CSV_FILE_PATH = "upkeep-people.csv" 
TABLE_NAME = "users"

def hash_password(password: str) -> str:
    # Generates a hashed password compatible with your auth backend
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def import_people():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        print("Connected to database for People import.")

        # Default password for imported users (they can reset it later)
        default_hashed_pwd = hash_password("Pulseworks123!")

        with open(CSV_FILE_PATH, 'r', encoding='utf-8-sig') as file:
            reader = csv.reader(file)
            csv_headers = [h.strip() for h in next(reader)]

            insert_query = f'''
                INSERT INTO "{TABLE_NAME}" 
                (id, first_name, last_name, email, password, role, approval_status, organization_id, created_at) 
                VALUES (%s, %s, %s, %s, %s, %s, 'APPROVED', %s, NOW())
                ON CONFLICT (email) DO NOTHING
            '''

            row_count = 0
            for row in reader:
                row_dict = dict(zip(csv_headers, row))
                
                name = row_dict.get("Name", "").strip()
                if not name: 
                    continue

                # Split name into First and Last name
                name_parts = name.split(" ", 1)
                first_name = name_parts[0]
                last_name = name_parts[1] if len(name_parts) > 1 else ""

                email = row_dict.get("Email", "").strip().lower()
                if not email or "@" not in email: 
                    continue

                account_type = row_dict.get("Account Type", "").strip().upper()
                role = "ADMIN" if "ADMINISTRATOR" in account_type else "USER"

                user_uuid = str(uuid.uuid4())

                cur.execute(insert_query, (
                    user_uuid, 
                    first_name, 
                    last_name, 
                    email, 
                    default_hashed_pwd, 
                    role, 
                    DEFAULT_ORG_ID
                ))
                row_count += 1

        conn.commit()
        print(f"Success! Imported {row_count} people into your organization users.")
    except Exception as e:
        print(f"Error importing people: {e}")
        if 'conn' in locals(): 
            conn.rollback()
    finally:
        if 'cur' in locals(): 
            cur.close()
        if 'conn' in locals(): 
            conn.close()

if __name__ == "__main__":
    import_people()