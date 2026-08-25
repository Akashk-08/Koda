# Root Directory Structure

upkeep-clone/
├── backend/            # Node.js, Express, AWS SDKs, Database models
├── frontend-web/       # React, TypeScript, Vite/Next.js
├── frontend-mobile/    # (Future) React Native / Expo
├── shared/             # TypeScript interfaces and constants used everywhere
├── docs/               # System architecture and schema planning docs and setup docs
├── .gitignore
├── package.json        # Root package manager (if using npm/yarn workspaces)
└── README.md

## /docs

docs/
├── architecture/
│   ├── aws-infrastructure.md    # EC2, RDS, DocumentDB network maps
│   └── ai-integration.md        # How Hugging Face API routes work
└── schemas/
    ├── postgres-relational.md   # Tables for Users, Work Orders, Core Assets
    ├── docdb-unstructured.md    # JSON structures for custom fields/logs
    └── api-contracts.md         # What the JSON payloads look like

## /backend

backend/
├── src/
│   ├── config/              # AWS, Database, and API configurations
│   │   ├── aws.ts           # EC2/S3 config
│   │   ├── database.ts      # Postgres (RDS) and DocDB connections
│   │   └── huggingface.ts   # LLM API keys
│   │
│   ├── controllers/         # Handles incoming HTTP requests
│   │   ├── workOrder.ts
│   │   ├── asset.ts
│   │   ├── inventory.ts
│   │   └── aiHelper.ts      # Routes for the "Nova" AI features
│   │
│   ├── services/            # The heavy business logic (where the actual work happens)
│   │   ├── aiService.ts     # Formatting prompts and parsing LLM responses
│   │   ├── dbService.ts     # Complex relational queries
│   │   └── workflow.ts      # Escalation and Jira-like logic
│   │
│   ├── models/              # Database schemas
│   │   ├── postgres/        # TypeORM, Prisma, or Sequelize schemas
│   │   │   ├── User.ts
│   │   │   ├── Asset.ts
│   │   │   └── WorkOrder.ts
│   │   └── docdb/           # Mongoose or native MongoDB schemas
│   │       ├── CustomField.ts
│   │       └── InspectionLog.ts
│   │
│   ├── routes/              # Express API endpoints mapping to controllers
│   │   ├── v1/
│   │       ├── workorders.ts
│   │       └── ai.ts
│   │
│   ├── middleware/          # Auth, error handling, validation
│   └── app.ts               # Express application entry point
│
├── .env                     # Local secrets (NEVER commit this)
├── package.json
└── tsconfig.json

## /shared

shared/
├── types/
│   ├── WorkOrder.ts         # e.g., export interface IWorkOrder { id: string; status: string; }
│   ├── Asset.ts
│   └── User.ts
├── enums/
│   ├── statuses.ts          # e.g., export enum Status { OPEN, IN_PROGRESS, CLOSED }
│   └── priorities.ts
└── package.json             # Makes this folder a private NPM package for your workspace

## /frontend-web

frontend-web/
├── src/
│   ├── assets/              # Images, icons, global CSS
│   ├── components/          # Reusable UI elements (dumb components)
│   │   ├── common/          # Buttons, Modals, Inputs
│   │   └── layout/          # Sidebar, Header, Navigation
│   │
│   ├── features/            # Feature-specific components (smart components)
│   │   ├── workOrders/      # Lists, forms, and detail views for Work Orders
│   │   ├── assets/          # Asset tracking and Jira-like dependency graphs
│   │   ├── inventory/       # Reorder points, stock lists
│   │   └── aiAssistant/     # Chat UI or "Nova" suggestion panels
│   │
│   ├── hooks/               # Custom React hooks (e.g., useAuth, useWorkOrders)
│   ├── pages/               # Top-level route components
│   │   ├── Dashboard.tsx
│   │   ├── AssetDetail.tsx
│   │   └── Settings.tsx
│   │
│   ├── services/            # API call logic (Axios/Fetch) interacting with your backend
│   │   └── api.ts
│   │
│   ├── store/               # Global state (Redux, Zustand, or Context)
│   ├── utils/               # Formatting dates, parsing strings
│   ├── App.tsx              # Main routing file
│   └── main.tsx             # React entry point
│
├── package.json
├── vite.config.ts           # (If using Vite)
└── tsconfig.json

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