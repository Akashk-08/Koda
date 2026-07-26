# to run the frontend code design

cd fronend-web/

npm run dev 

# to check the backend is connected

cd backend/

npm run dev 

# To check prisma studio 

cd backend/

npx prisma studio

# First, generate the diagram:

npx prisma generate

# Then, use this specific Mac command to force it to open in Google Chrome

open -a "Google Chrome" prisma/ERD.svg