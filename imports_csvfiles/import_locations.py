import csv
import psycopg2

# CONFIGURATION
DB_CONFIG = {
    "dbname": "koda_db",
    "user": "koda_user",      
    "password": "koda_password",  
    "host": "localhost",
    "port": "5434"
}

YOUR_ORG_ID = "b263d052-265f-4da1-82c6-4706a7de9955"

CSV_FILE_PATH = "upkeep-locations.csv" 
TABLE_NAME = "Location"         

COLUMN_MAPPING = {
    "ID": "id",
    "Name": "name",
    "Address": "address",
    "Longitude": "longitude",
    "Latitude": "latitude",
    "Parent Location Name": "parentLocationName",
    "Parent Location ID": "parentLocationId",
    "Assigned To Emails": "assignedToEmails",
    "Team Assigned Names": "teamAssignedNames",
    "Customer Assigned Names": "customerAssignedNames",
    "Vendor Assigned Names": "vendorAssignedNames"
}

def import_csv_to_postgres():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        print("Successfully connected to the database.")

        with open(CSV_FILE_PATH, 'r', encoding='utf-8-sig') as file:
            reader = csv.reader(file)
            csv_headers = next(reader) 

            # Map the CSV headers
            db_columns = [f'"{COLUMN_MAPPING.get(header.strip(), header.strip())}"' for header in csv_headers]
            db_columns.append('"organizationId"') 
            
            columns_string = ', '.join(db_columns)
            placeholders = ', '.join(['%s'] * len(db_columns))
            
            # Added ON CONFLICT ("id") DO NOTHING so it gracefully skips duplicates
            insert_query = f'''
                INSERT INTO "{TABLE_NAME}" ({columns_string}) 
                VALUES ({placeholders})
                ON CONFLICT ("id") DO NOTHING;
            '''
            
            print("Processing rows and skipping any existing duplicates...")

            inserted_count = 0
            skipped_count = 0
            
            for row in reader:
                processed_row = [None if val.strip() == "" else val.strip() for val in row]
                processed_row.append(YOUR_ORG_ID)
                
                cur.execute(insert_query, processed_row)
                
                # cur.rowcount is 1 if inserted, 0 if skipped due to conflict
                if cur.rowcount == 1:
                    inserted_count += 1
                else:
                    skipped_count += 1

        conn.commit()
        print(f"Success! Imported {inserted_count} new locations. (Skipped {skipped_count} existing duplicates).")

    except Exception as e:
        print(f"An error occurred: {e}")
        if 'conn' in locals():
            conn.rollback() 
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    import_csv_to_postgres()