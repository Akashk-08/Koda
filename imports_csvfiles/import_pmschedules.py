import csv
import psycopg2
import uuid
import json
from datetime import datetime

# DB Config matching your Prisma local setup
DB_CONFIG = {
    "dbname": "koda_db", 
    "user": "koda_user", 
    "password": "koda_password", 
    "host": "localhost", 
    "port": "5434"
}

DEFAULT_ORG_ID = "b263d052-265f-4da1-82c6-4706a7de9955"
CSV_FILE_PATH = "upkeep-pmschedules.csv"
TABLE_NAME = "preventive_maintenances"

def import_pmschedules():
    conn = None
    cur = None
    try:
        print("Connecting to database...")
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        
        # Step 1: Pre-fetch all Koda Users so we can map emails to UUIDs!
        print("Fetching existing Koda users to map assignments...")
        cur.execute('SELECT id, email FROM "users" WHERE organization_id = %s', (DEFAULT_ORG_ID,))
        koda_users = cur.fetchall()
        
        # Create a dictionary of { "email@pulseworks.com": "uuid-1234-abcd" }
        user_email_map = {user[1].lower(): user[0] for user in koda_users}
        print(f"Found {len(user_email_map)} users in Koda database.")

        with open(CSV_FILE_PATH, 'r', encoding='utf-8-sig') as file:
            reader = csv.reader(file)
            csv_headers = [h.strip() for h in next(reader)]

            insert_query = f'''
                INSERT INTO "{TABLE_NAME}" 
                (id, title, "scheduleType", "next_due_date", "organization_id", "created_at", description, "task_data", "assignee_id") 
                VALUES (%s, %s, %s, %s, %s, NOW(), %s, %s, %s) 
                ON CONFLICT DO NOTHING
            '''

            row_count = 0
            mapped_count = 0
            
            for row in reader:
                if not row: 
                    continue
                
                row_dict = dict(zip(csv_headers, row))
                title = row_dict.get("PM Template Name", "").strip()
                if not title: 
                    continue

                pm_uuid = str(uuid.uuid4())
                
                # Normalize schedule types
                raw_freq = row_dict.get("This Reoccurs Every (Days/Weeks/Years)", "").strip().lower()
                schedule_type = "MONTHLY" 
                
                if "year" in raw_freq:
                    schedule_type = "YEARLY"
                elif "month" in raw_freq:
                    schedule_type = "MONTHLY"
                elif "week" in raw_freq:
                    schedule_type = "WEEKLY"
                elif "day" in raw_freq:
                    schedule_type = "DAILY"

                # Parse Due Date
                next_due = row_dict.get("Next Work Order Due Date", "").strip()
                if not next_due:
                    next_due = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                else:
                    try:
                         dt_obj = datetime.strptime(next_due, '%m/%d/%Y %I:%M %p')
                         next_due = dt_obj.strftime('%Y-%m-%d %H:%M:%S')
                    except ValueError:
                         next_due = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

                # Description formatting
                asset_name = row_dict.get("Asset Name", "No Asset")
                location_name = row_dict.get("Location Name", "No Location")
                assignee_email = row_dict.get("Primary Assignee Email", "Unassigned")
                
                rich_description = f"📍 Loc: {location_name} | ⚙️ Asset: {asset_name} | 👤 Assignee: {assignee_email}"

                # JSON Metadata
                upkeep_metadata = {
                    "legacyUpkeepId": row_dict.get("ID", ""),
                    "legacyAssetId": row_dict.get("Asset Id", ""),
                    "assetName": asset_name,
                    "locationName": location_name,
                    "primaryAssigneeEmail": assignee_email,
                    "teamName": row_dict.get("Team Name", ""),
                }
                task_data_json = json.dumps(upkeep_metadata)

                # ==========================================
                # MAGIC HAPPENS HERE: OFFICIAL ASSIGNMENT
                # ==========================================
                official_koda_assignee_id = None
                
                # Check if the UpKeep email exists in our Koda database mapping
                if assignee_email.lower() in user_email_map:
                    official_koda_assignee_id = user_email_map[assignee_email.lower()]
                    mapped_count += 1

                cur.execute(insert_query, (
                    pm_uuid, 
                    title, 
                    schedule_type, 
                    next_due, 
                    DEFAULT_ORG_ID, 
                    rich_description, 
                    task_data_json,
                    official_koda_assignee_id # Injecting the real UUID!
                ))
                row_count += 1

        conn.commit()
        print(f"✅ Success! Imported {row_count} PM schedules.")
        print(f"🎯 Successfully auto-mapped {mapped_count} PMs to official Koda users!")
        
    except Exception as e:
        print(f"❌ Error importing PM schedules: {e}")
        if conn: 
            conn.rollback()
    finally:
        if cur: 
            cur.close()
        if conn: 
            conn.close()

if __name__ == "__main__":
    import_pmschedules()