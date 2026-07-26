-- Manages access for facility managers and field technicians and admins 

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    role VARCHAR(20) NOT NULL, -- e.g., 'ADMIN', 'MANAGER', 'TECHNICIAN'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

# 2. Assets Table
# The core physical equipment Koda manages
CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50), -- e.g., 'HVAC', 'Fleet', 'IT Infrastructure'
    status VARCHAR(20) DEFAULT 'OPERATIONAL', -- 'OPERATIONAL', 'MAINTENANCE', 'DOWN'
    location VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Asset Dependencies (The "Jira Edge")
-- This is what sets Koda apart from UpKeep. It maps how assets rely on each other.
CREATE TABLE asset_dependencies (
    parent_asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
    child_asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
    dependency_type VARCHAR(50), -- e.g., 'COOLS', 'POWERS', 'HOUSES'
    PRIMARY KEY (parent_asset_id, child_asset_id)
);

-- 4. Work Orders Table
-- The core workflow engine
CREATE TABLE work_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(150) NOT NULL,
    description TEXT,
    priority VARCHAR(20) DEFAULT 'MEDIUM', -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    status VARCHAR(20) DEFAULT 'OPEN', -- 'OPEN', 'IN_PROGRESS', 'REVIEW', 'CLOSED'
    asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    due_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP WITH TIME ZONE
);