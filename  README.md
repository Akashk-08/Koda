koda/
├── android/            # Native Android container project (Capacitor)
├── ios/                # Native iOS container project (Capacitor)
├── backend/            # Node.js, Express, TypeScript backend services & API logic
├── frontend-web/       # React, TypeScript, Vite web application frontend
├── imports_csvfiles/   # Python data migration scripts and raw CSV datasets for upkeep data
├── PulseworksAI/       # AI integration modules and experiment directories
├── docs/               # System architecture, schemas, and setup documentation
├── .gitignore
├── capacitor.config.json # Capacitor native mobile configuration
├── package.json        # Root package manager configuration
└── README.md

## /docs

docs/
├── docker_setup        # Container deployment configurations
├── run                 # Local execution startup scripts
├── architecture/
│   ├── aws-infrastructure.md    # EC2, RDS, and network maps
│   └── ai-integration.md        # API routing and model workflow documentation
└── schemas/
    ├── postgres-relational.md   # Tables for Users, Work Orders, and Core Assets
    └── api-contracts.md         # Expected JSON request/response payloads

## /backend

backend/
├── src/
│   ├── config/              # Database and third-party API configurations
│   │   ├── database.ts      # Postgres / Prisma adapter connection setup
│   │   └── huggingface.ts   # LLM and external API keys
│   │
│   ├── controllers/         # Handles incoming HTTP requests and responses
│   │   ├── workorder.ts     # Work order operations handler
│   │   ├── asset.ts         # Asset tracking operations handler
│   │   ├── inventory.ts     # Parts and stock inventory management
│   │   └── users.ts         # User management and auth routing logic
│   │
│   ├── services/            # Heavy business logic layer
│   │   └── notificationService.ts # Push notifications and email triggers
│   │
│   ├── Routes/              # Express API endpoint routers
│   │   ├── workorders.ts    # Routes mapping to work order endpoints
│   │   ├── assets.ts        # Routes for asset tracking and dependencies
│   │   ├── inventory.ts     # Parts inventory endpoints
│   │   ├── pm.ts            # Preventive maintenance schedules
│   │   ├── locations.ts     # Site location routers
│   │   ├── teams.ts         # Team mapping and user associations
│   │   ├── users.ts         # User profiles and access approval endpoints
│   │   ├── calendar.ts      # Google Calendar integration routes
│   │   ├── auditLogs.ts     # System audit trail logs
│   │   └── notifications.ts # User notification fetch and read receipts
│   │
│   ├── utils/               # Internal helper modules
│   │   ├── logger.ts        # Winston logging setup (file and console transports)
│   │   └── prisma.ts        # Centralized Prisma 7 client with driver adapter
│   │
│   └── index.ts             # Express application entry point and middleware config
│
├── uploads/                 # Local directory for uploaded documents and files
├── prisma/                  # Database schema definitions and migrations
│   └── schema.prisma        # Prisma schema file mapping models and enums
├── clean_duplicates.ts      # Database maintenance script to remove redundant assets
├── heal-assets.ts           # CSV asset synchronization and data repair script
├── categorizeAssets.js      # Automated asset classification script
├── .env                     # Local environment secrets and credentials
├── package.json             # Backend dependencies and build scripts
└── tsconfig.json            # TypeScript compiler configuration for backend

## /frontend-web

frontend-web/
├── src/
│   ├── assets/              # Static images, global styles, and CSS assets
│   ├── components/          # Reusable UI elements and layout containers
│   ├── hooks/               # Custom React hooks (e.g., useAuth, useWorkOrders)
│   ├── pages/               # Top-level route components and views
│   ├── services/            # API call logic interacting with backend endpoints
│   ├── utils/               # Formatting dates, parsing strings, and helpers
│   ├── App.tsx              # Main routing configuration and layout wrapper
│   └── main.tsx             # React entry point, Sentry init, and DOM render
│
├── .env                     # Frontend environment configuration (VITE_API_URL)
├── package.json             # Frontend web dependencies
├── vite.config.ts           # Vite bundler configuration
└── tsconfig.json            # TypeScript compiler options for frontend

## /imports_csvfiles

imports_csvfiles/            # Data engineering scripts & historical spreadsheets
├── add_indexes.py           # Database indexing scripts
├── delete_workorders.py     # Batch cleanup scripts
├── import_assets.py         # Asset ingestion pipelines
├── import_locations.py      # Location mapping pipelines
├── import_parts.py          # Inventory bulk loaders
├── import_pmschedules.py    # Preventive maintenance schedule migrations
├── import_workorders.py     # Historical work order importers
└── *.csv                    # Raw dataset dumps (upkeep-assets.csv, upkeep-parts.csv, etc.)

## Commands to download the packages

mkdir koda
cd koda
git init

## Create the frontend app using Vite's React+TypeScript template

npm create vite@latest frontend-web -- --template react-ts

## Move into the frontend directory

cd frontend-web

## Install the default Vite dependencies

npm install

## Install the modern 2026 standard UI and state management packages

## - react-router-dom: For navigating between dashboard pages

## - @tanstack/react-query: The standard for fetching API data

## - zustand: A lightweight alternative to Redux for client state

## - lucide-react: Great standard icons for your UI

npm install react-router-dom @tanstack/react-query zustand lucide-react

## Install TailwindCSS (Standard for quick, modern UI styling)

npm install -D tailwindcss postcss autoprefixer npx tailwindcss init -p

# Go back to the root folder

cd ..

## Set Up the Node.js Backend

## Create and enter the backend directory

mkdir backend
cd backend

## Initialize a new Node.js project (creates package.json)

npm init -y

## Install core Express and database dependencies

## - express: The web framework

## - cors: To allow your React frontend to talk to this backend

## - dotenv: To manage your AWS and API keys securely

## - @prisma/client: The database client for PostgreSQL

npm install express cors dotenv @prisma/client

## Install TypeScript and developer tools

## - tsx: A modern execution engine to run TypeScript directly

## - prisma: The ORM CLI to manage your database schema

npm install -D typescript @types/node @types/express @types/cors tsx prisma

## Initialize TypeScript configuration (creates tsconfig.json)

npx tsc --init

## Initialize Prisma (this creates your prisma folder and .env file)

npx prisma init

## Go back to the root folder

cd ..

## Set Up the Shared Folder

## Create the shared directory

mkdir shared
cd shared

## Initialize as a basic npm package

npm init -y

## Install TypeScript

npm install -D typescript
npx tsc --init

## Go back to the root folder

cd ..

## Create the Docs Folder

mkdir -p docs/architecture docs/schemas


npx prisma db push
npx prisma generate
npx prisma studio

## Build and sync:

cd frontend-web
npm run build 
cd .. 
npx cap sync

## Build for ios 
npx cap sync ios

## build for Android
npx cap sync android

## to check current IP address 
ipconfig getifaddr en0 