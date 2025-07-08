-- Drop existing preventative completions first due to foreign key constraint
DROP TABLE IF EXISTS preventative_completions;

-- Create a new sequence for preventative IDs starting at 90001
CREATE SEQUENCE IF NOT EXISTS preventative_id_seq START WITH 90001;

-- Create a temporary table to store existing preventative data
CREATE TEMPORARY TABLE temp_preventatives AS 
SELECT * FROM preventatives;

-- Drop the existing preventatives table
DROP TABLE preventatives;

-- Recreate preventatives table with new ID structure
CREATE TABLE preventatives (
    id INTEGER PRIMARY KEY DEFAULT nextval('preventative_id_seq'),
    pet_id INTEGER NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    due_day INTEGER NOT NULL CHECK (due_day >= 1 AND due_day <= 31),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Copy data back with new IDs
INSERT INTO preventatives (pet_id, name, due_day, notes, created_at, updated_at)
SELECT pet_id, name, due_day, notes, created_at, updated_at
FROM temp_preventatives;

-- Recreate preventative_completions table
CREATE TABLE preventative_completions (
    id SERIAL PRIMARY KEY,
    preventative_id INTEGER NOT NULL REFERENCES preventatives(id) ON DELETE CASCADE,
    completion_date DATE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(preventative_id, completion_date)
);
