-- Drop existing foreign key constraint
ALTER TABLE task_completions DROP CONSTRAINT task_completions_task_id_fkey;

-- Create a new table to track all tasks (both daily and preventative)
DROP TABLE IF EXISTS tasks;
CREATE TABLE tasks (
    id INTEGER PRIMARY KEY,
    task_type VARCHAR(20) NOT NULL CHECK (task_type IN ('daily', 'preventative')),
    CONSTRAINT tasks_id_range_check CHECK (
        (task_type = 'daily' AND id < 90001) OR
        (task_type = 'preventative' AND id >= 90001)
    )
);

-- Insert existing daily tasks
INSERT INTO tasks (id, task_type)
SELECT id, 'daily' FROM daily_tasks;

-- Insert existing preventative tasks
INSERT INTO tasks (id, task_type)
SELECT id, 'preventative' FROM preventatives;

-- Remove any task completions that reference non-existent tasks
DELETE FROM task_completions
WHERE task_id NOT IN (SELECT id FROM tasks);

-- Add new foreign key constraint to unified tasks table
ALTER TABLE task_completions
ADD CONSTRAINT task_completions_task_id_fkey
FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE;

-- Insert missing daily tasks
INSERT INTO tasks (id, task_type)
SELECT id, 'daily'
FROM daily_tasks
WHERE id NOT IN (SELECT id FROM tasks);

-- Insert missing preventatives
INSERT INTO tasks (id, task_type)
SELECT id, 'preventative'
FROM preventatives
WHERE id NOT IN (SELECT id FROM tasks);

-- Verify tasks were inserted
SELECT * FROM tasks ORDER BY id;
