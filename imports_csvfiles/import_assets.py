# model="gpt-5-nano"
import psycopg2
import csv
import uuid
from datetime import datetime

DB_CONFIG = {
    "dbname": "koda_db", 
    "user": "koda_user", 
    "password": "koda_password", 
    "host": "localhost", 
    "port": "5434"
}

YOUR_ORG_ID = "5df74865-c2e6-43e9-a270-41dca24f32dc"

# Valid Enums to prevent DB rejection
VALID_CATEGORIES = [
    "ANNUAL_PREVENTIVE_MAINTENANCE", "ASSETS", "LARGE_DAMAGE", 
    "PARTS_REQUEST", "PROJECT_UPGRADE", "SIX_MONTH_PREVENTIVE_MAINTENANCE", 
    "SUPPORT_REQUEST", "WEEKLY_MONTHLY_CHECKLISTS"
]

def import_assets_from_csv():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        print("Connecting to database...")

        table_name = '"assets"'

        with open('upkeep-assets.csv', mode='r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            inserted_count = 0
            
            for row in reader:
                name = row.get('Name', '').strip()
                if not name:
                    continue  # Skip empty rows
                    
                description = row.get('Description', '').strip() or None
                location_name = row.get('Location Name', '').strip() or None
                
                # Format the category to match your Prisma Enums
                raw_category = row.get('Category', '').strip().replace(' ', '_').upper()
                category = raw_category if raw_category in VALID_CATEGORIES else None
                
                serial_number = row.get('Serial Number', '').strip() or None
                barcode = row.get('Barcode', '').strip() or None
                model = row.get('Model', '').strip() or None
                
                # Check if it was marked as 'down' in the old system
                raw_status = row.get('Status', '').lower()
                status = 'DAMAGED' if 'down' in raw_status else 'OPERATIONAL'
                
                # Generate unique ID and timestamps required by Prisma
                asset_id = str(uuid.uuid4())
                now = datetime.now()

                # Using the exact snake_case columns from your old script
                insert_query = f"""
                    INSERT INTO {table_name} 
                    ("id", "name", "description", "location_name", "category", "serial_number", "barcode", "model", "status", "organization_id", "created_at", "updated_at")
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
                """
                
                cur.execute(insert_query, (
                    asset_id, name, description, location_name, category, 
                    serial_number, barcode, model, status, YOUR_ORG_ID, now, now
                ))
                
                inserted_count += 1
                if inserted_count % 50 == 0:
                    print(f"Imported {inserted_count} assets...")

        # Commit all the rows to the database
        conn.commit()
        print(f"\n SUCCESS! Fully imported {inserted_count} assets with all barcodes and locations!")

    except Exception as e:
        print(f"Error: {e}")
        if 'conn' in locals(): conn.rollback()
    finally:
        if 'cur' in locals(): cur.close()
        if 'conn' in locals(): conn.close()

if __name__ == "__main__":
    import_assets_from_csv()