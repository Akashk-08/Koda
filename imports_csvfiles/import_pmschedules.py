import csv
import psycopg2
import uuid
from datetime import datetime

DB_CONFIG = {
    "dbname": "koda_db", "user": "koda_user", "password": "koda_password", "host": "localhost", "port": "5434"
}
DEFAULT_ORG_ID = "5df74865-c2e6-43e9-a270-41dca24f32dc"
CSV_FILE_PATH = "upkeep-pmschedules.csv" 
TABLE_NAME = "preventive_maintenances"

def import_pmschedules():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        with open(CSV_FILE_PATH, 'r', encoding='utf-8-sig') as file:
            reader = csv.reader(file)
            csv_headers = [h.strip() for h in next(reader)]

            insert_query = f'''
                INSERT INTO "{TABLE_NAME}" 
                (id, title, "scheduleType", "next_due_date", "organization_id", "created_at") 
                VALUES (%s, %s, %s, %s, %s, NOW()) 
                ON CONFLICT DO NOTHING
            '''

            row_count = 0
            for row in reader:
                row_dict = dict(zip(csv_headers, row))
                title = row_dict.get("PM Template Name", "").strip()
                if not title: continue

                pm_uuid = str(uuid.uuid4())
                schedule_type = row_dict.get("Schedule Type", "").strip().upper()
                if schedule_type not in ["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"]:
                    schedule_type = "MONTHLY"

                # Fallback to current date if next due date is missing in CSV
                next_due = row_dict.get("Next Work Order Due Date", "").strip()
                if not next_due:
                    next_due = datetime.now().strftime('%Y-%m-%d')

                cur.execute(insert_query, (pm_uuid, title, schedule_type, next_due, DEFAULT_ORG_ID))
                row_count += 1

        conn.commit()
        print(f"Success! Imported {row_count} PM schedules.")
    except Exception as e:
        print(f"Error importing PM schedules: {e}")
        if 'conn' in locals(): conn.rollback()
    finally:
        if 'cur' in locals(): cur.close()
        if 'conn' in locals(): conn.close()

if __name__ == "__main__":
    import_pmschedules()