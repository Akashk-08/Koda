# model="gpt-5-nano"
import psycopg2
import csv
import uuid
import math
from datetime import datetime

DB_CONFIG = {
    "dbname": "koda_db", 
    "user": "koda_user", 
    "password": "koda_password", 
    "host": "localhost", 
    "port": "5434"
}

YOUR_ORG_ID = "5df74865-c2e6-43e9-a270-41dca24f32dc"

def safe_float(val):
    try:
        v = float(val)
        return 0.0 if math.isnan(v) else v
    except:
        return 0.0

def safe_int(val):
    try:
        v = float(val)
        return 0 if math.isnan(v) else int(v)
    except:
        return 0

def safe_bool(val):
    return str(val).strip().lower() in ['true', '1', 'yes', 'y']

def import_parts_from_csv():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        print("Connecting to database...")

        # Since Prisma does not have an @@map for InventoryPart, it uses the exact case
        table_name = '"InventoryPart"'

        with open('upkeep-parts.csv', mode='r', encoding='utf-8-sig') as file:
            reader = csv.DictReader(file)
            inserted_count = 0
            
            for row in reader:
                name = row.get('Name', '').strip()
                if not name:
                    continue  # Skip rows without a part name
                    
                part_number = row.get('Part Number', '').strip() or None
                location_name = row.get('Location Name', '').strip() or None
                description = row.get('Description', '').strip() or None
                category = row.get('Category', '').strip() or None
                barcode = row.get('Barcode', '').strip() or None
                area = row.get('Area', '').strip() or None
                tags = row.get('Tags', '').strip() or None
                
                # Numeric conversions
                cost = safe_float(row.get('Cost per unit'))
                quantity = safe_int(row.get('Quantity'))
                min_qty = safe_int(row.get('Minimum Quantity'))
                max_qty = safe_int(row.get('Maximum Quantity'))
                
                # Boolean conversions
                is_non_stock = safe_bool(row.get('Mark Non-Stock'))
                is_critical = safe_bool(row.get('Mark Critical'))
                
                part_id = str(uuid.uuid4())
                now = datetime.now()

                # Exact camelCase columns mapping your schema.prisma
                insert_query = f"""
                    INSERT INTO {table_name} 
                    ("id", "name", "partNumber", "description", "category", "cost", "barcode", "tags", 
                     "isNonStock", "isCritical", "availableQty", "minQty", "maxQtyThreshold", "siteLocation", 
                     "area", "organizationId", "createdAt", "updatedAt")
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
                """
                
                cur.execute(insert_query, (
                    part_id, name, part_number, description, category, cost, barcode, tags,
                    is_non_stock, is_critical, quantity, min_qty, max_qty, location_name,
                    area, YOUR_ORG_ID, now, now
                ))
                
                inserted_count += 1
                if inserted_count % 50 == 0:
                    print(f"Imported {inserted_count} parts...")

        conn.commit()
        print(f"\n SUCCESS! Fully imported {inserted_count} parts with complete locations and quantities!")

    except Exception as e:
        print(f"Error: {e}")
        if 'conn' in locals(): conn.rollback()
    finally:
        if 'cur' in locals(): cur.close()
        if 'conn' in locals(): conn.close()

if __name__ == "__main__":
    import_parts_from_csv()