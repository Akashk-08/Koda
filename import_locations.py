import csv
import psycopg2

# --- CONFIGURATION ---
DB_CONFIG = {
    "dbname": "koda_db",
    "user": "koda_user",      
    "password": "koda_password",  
    "host": "localhost",
    "port": "5434"
}

CSV_FILE_PATH = "upkeep-locations.csv" 
TABLE_NAME = "Location"         

# THIS IS THE MAGIC FIX: It translates your CSV headers into Prisma's exact column names
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

        with open(CSV_FILE_PATH, 'r', encoding='utf-8-sig') as file: # utf-8-sig safely ignores hidden characters
            reader = csv.reader(file)
            csv_headers = next(reader) 

            # Map the CSV headers to our Prisma database columns using the dictionary above
            db_columns = [f'"{COLUMN_MAPPING.get(header.strip(), header.strip())}"' for header in csv_headers]
            columns_string = ', '.join(db_columns)
            placeholders = ', '.join(['%s'] * len(csv_headers))
            
            insert_query = f'INSERT INTO "{TABLE_NAME}" ({columns_string}) VALUES ({placeholders})'
            print(f"Preparing to execute: {insert_query}")

            row_count = 0
            for row in reader:
                # Convert empty strings from the CSV into proper NULL values for the database
                processed_row = [None if val.strip() == "" else val.strip() for val in row]
                cur.execute(insert_query, processed_row)
                row_count += 1

        conn.commit()
        print(f"Success! Imported {row_count} rows into the '{TABLE_NAME}' table.")

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