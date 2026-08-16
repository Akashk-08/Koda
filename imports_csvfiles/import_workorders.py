import csv
import psycopg2
from datetime import datetime
import json

DB_CONFIG = {
    "dbname": "koda_db", 
    "user": "koda_user", 
    "password": "koda_password", 
    "host": "localhost", 
    "port": "5434"
}

DEFAULT_ORG_ID = "5df74865-c2e6-43e9-a270-41dca24f32dc"
CSV_FILE_PATH = "upkeep-workorders.csv" 
TABLE_NAME = "work_orders"

# HELPER FUNCTIONS 
def parse_float(val):
    try: return float(val)
    except (ValueError, TypeError): return None

def parse_int(val):
    try: return int(float(val))
    except (ValueError, TypeError): return None

def parse_bool(val):
    return str(val).strip().upper() in ["YES", "TRUE", "1", "Y"]

def combine_datetime(d, t):
    ds, ts = str(d).strip(), str(t).strip()
    if not ds and not ts: return None
    if not ts: return ds
    return f"{ds} {ts}"

def parse_category(val):
    VALID_CATEGORIES = [
        "ANNUAL_PREVENTIVE_MAINTENANCE", "ASSETS", "LARGE_DAMAGE", 
        "PARTS_REQUEST", "PROJECT_UPGRADE", "SIX_MONTH_PREVENTIVE_MAINTENANCE", 
        "SUPPORT_REQUEST", "WEEKLY_MONTHLY_CHECKLISTS"
    ]
    formatted = str(val).strip().upper().replace(" ", "_").replace("/", "_").replace("-", "_")
    return formatted if formatted in VALID_CATEGORIES else None

def parse_json(val):
    raw = str(val).strip()
    if not raw: return None
    try:
        return json.dumps(json.loads(raw))
    except:
        return json.dumps({"raw_data": raw})


def import_workorders():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        print("Connected to database.")

        # 1. WIPE TABLE AND RESET THE ID COUNTER TO 1
        print("Clearing existing work orders and resetting ID sequence to 1...")
        cur.execute(f'TRUNCATE TABLE "{TABLE_NAME}" RESTART IDENTITY CASCADE;')
        conn.commit()

        # Cache email -> user UUID lookups for assignee mapping
        cur.execute('SELECT id, email FROM "users";')
        email_to_user_id = {row[1].lower(): row[0] for row in cur.fetchall()}

        with open(CSV_FILE_PATH, 'r', encoding='utf-8-sig') as file:
            reader = csv.reader(file)
            csv_headers = [h.strip() for h in next(reader)]

            insert_query = f'''
                INSERT INTO "{TABLE_NAME}" (
                    "upkeep_id", "title", "description", "work_order_number", 
                    "due_date", "start_date", "closed_at", "status", "custom_status", 
                    "estimated_hours", "priority", "category", "completed_by_email",
                    "assigned_by_email", "assigned_to_email", "additional_assignee_emails",
                    "requested_by_email", "team_assigned_name", "asset_name", "location_name",
                    "checklist_id", "parts_names", "part_quantities", "purchase_order_names",
                    "file_id", "requires_signature", "is_archived", "additional_cost",
                    "time_hours", "created_at", "updated_at", "asset_category", "next_due_date",
                    "root_work_order_exists", "task_data", "repeating_schedule", 
                    "stop_repeating_on", "reschedule_based_on_completion", "labor_cost",
                    "assigned_to", "organization_id"
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                )
            '''

            row_count = 0
            matched_assignees = 0
            
            for row in reader:
                row_dict = dict(zip(csv_headers, row))
                
                # Title parsing (Required)
                raw_title = row_dict.get("Work Order Title", "").strip()
                if not raw_title: 
                    continue
                title = raw_title[:150]

                # Enum parsing (Priority & Status)
                priority = row_dict.get("Priority", "").strip().upper()
                if priority not in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]: priority = "MEDIUM"

                status = row_dict.get("Work Order Status", "").strip().upper().replace(" ", "_")
                if status == "ON_HOLD": status = "onHOLD"
                elif status == "COMPLETED": status = "COMPLETE"
                if status not in ["OPEN", "IN_PROGRESS", "onHOLD", "COMPLETE", "REVIEW", "CLOSED"]: status = "OPEN"

                # Assignee mapping
                assigned_email = row_dict.get("Assigned To Email", "").strip().lower()
                assigned_to_id = email_to_user_id.get(assigned_email, None)
                if assigned_to_id: matched_assignees += 1

                # Execute Insertion
                cur.execute(insert_query, (
                    row_dict.get("Work Order ID", "").strip() or None,  
                    title,
                    row_dict.get("Work Order Description", "").strip() or None,
                    parse_int(row_dict.get("Work Order #")),
                    combine_datetime(row_dict.get("Due Date (Date)"), row_dict.get("Due Date (Time)")),
                    combine_datetime(row_dict.get("Start Date (Date)"), row_dict.get("Start Date (Time)")),
                    combine_datetime(row_dict.get("Completed On (Date)"), row_dict.get("Completed On (Time)")),
                    status,
                    row_dict.get("Custom Work Order Status", "").strip() or None,
                    parse_float(row_dict.get("Estimate Hours")),
                    priority,
                    parse_category(row_dict.get("Category")),
                    row_dict.get("Completed By Email", "").strip() or None,
                    row_dict.get("Assigned By Email", "").strip() or None,
                    row_dict.get("Assigned To Email", "").strip() or None,
                    row_dict.get("Additional Assignee Emails", "").strip() or None,
                    row_dict.get("Requested By Email", "").strip() or None,
                    row_dict.get("Team Assigned Name", "").strip() or None,
                    row_dict.get("Asset Name", "").strip() or None,
                    row_dict.get("Location Name", "").strip()[:150] or None,
                    row_dict.get("Checklist ID", "").strip() or None,
                    row_dict.get("Parts Names", "").strip() or None,
                    row_dict.get("Part Quantities", "").strip() or None,
                    row_dict.get("Purchase Order Names", "").strip() or None,
                    row_dict.get("File ID", "").strip() or None,
                    parse_bool(row_dict.get("Requires Signature (YES/NO)")),
                    parse_bool(row_dict.get("Archived Status (YES/NO)")),
                    parse_float(row_dict.get("Additional Cost")),
                    parse_float(row_dict.get("Time (Hours)")),
                    row_dict.get("Created on", "").strip() or datetime.now(),
                    row_dict.get("Updated on", "").strip() or datetime.now(),
                    row_dict.get("Asset Category", "").strip() or None,
                    row_dict.get("Next Due Date", "").strip() or None,
                    parse_bool(row_dict.get("Root Work Order Exists")),
                    parse_json(row_dict.get("Task Data")),
                    row_dict.get("Repeating Schedule", "").strip() or None,
                    combine_datetime(row_dict.get("Stop Repeating On (Date)"), row_dict.get("Stop Repeating On (Time)")),
                    parse_bool(row_dict.get("Reschedule Based On Completion")),
                    parse_float(row_dict.get("Labor Cost")),
                    assigned_to_id, 
                    DEFAULT_ORG_ID
                ))
                row_count += 1

        conn.commit()
        print(f"Success! Imported {row_count} complete work orders.")
        print(f"The next work order created in the app will be ID #{row_count + 1}.")
    except Exception as e:
        print(f"Error importing work orders: {e}")
        if 'conn' in locals(): 
            conn.rollback()
    finally:
        if 'cur' in locals(): cur.close()
        if 'conn' in locals(): conn.close()

if __name__ == "__main__":
    import_workorders()