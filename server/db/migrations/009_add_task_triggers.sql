-- Create triggers to automatically insert new tasks into the tasks table

-- First, make sure all existing tasks are in the tasks table
INSERT INTO tasks (id, task_type)
SELECT id, 'daily'
FROM daily_tasks
WHERE id NOT IN (SELECT id FROM tasks);

INSERT INTO tasks (id, task_type)
SELECT id, 'preventative'
FROM preventatives
WHERE id NOT IN (SELECT id FROM tasks);

-- Create trigger function for daily tasks
CREATE OR REPLACE FUNCTION insert_daily_task_trigger()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO tasks (id, task_type)
    VALUES (NEW.id, 'daily');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger function for preventatives
CREATE OR REPLACE FUNCTION insert_preventative_trigger()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO tasks (id, task_type)
    VALUES (NEW.id, 'preventative');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS insert_daily_task_trigger ON daily_tasks;
CREATE TRIGGER insert_daily_task_trigger
AFTER INSERT ON daily_tasks
FOR EACH ROW
EXECUTE FUNCTION insert_daily_task_trigger();

DROP TRIGGER IF EXISTS insert_preventative_trigger ON preventatives;
CREATE TRIGGER insert_preventative_trigger
AFTER INSERT ON preventatives
FOR EACH ROW
EXECUTE FUNCTION insert_preventative_trigger();
