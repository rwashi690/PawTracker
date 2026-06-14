-- Switch daily_tasks and preventatives IDs to UUID-style TEXT with prefixes d_ and p_
-- and update all related references and constraints. Make it idempotent-ish by guarding steps.

BEGIN;

-- Enable pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) Add new_id columns and populate with prefixed UUIDs
-- Daily tasks
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='daily_tasks' AND column_name='new_id'
  ) THEN
    ALTER TABLE daily_tasks ADD COLUMN new_id TEXT;
  END IF;
END$$;

UPDATE daily_tasks SET new_id = 'd_' || gen_random_uuid()::text WHERE new_id IS NULL;

-- Preventatives
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='preventatives' AND column_name='new_id'
  ) THEN
    ALTER TABLE preventatives ADD COLUMN new_id TEXT;
  END IF;
END$$;

UPDATE preventatives SET new_id = 'p_' || gen_random_uuid()::text WHERE new_id IS NULL;

-- 2) Prepare mapping helper indexes
CREATE INDEX IF NOT EXISTS idx_daily_tasks_new_id ON daily_tasks(new_id);
CREATE INDEX IF NOT EXISTS idx_preventatives_new_id ON preventatives(new_id);

-- 3) Add temp columns on referencing tables to hold new ids
-- tasks table (unified)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='tasks' AND column_name='new_task_id'
  ) THEN
    ALTER TABLE tasks ADD COLUMN new_task_id TEXT;
  END IF;
END$$;

-- task_completions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='task_completions' AND column_name='new_task_id'
  ) THEN
    ALTER TABLE task_completions ADD COLUMN new_task_id TEXT;
  END IF;
END$$;

-- preventative_completions
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name='preventative_completions'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name='preventative_completions' AND column_name='new_prev_id'
    ) THEN
      ALTER TABLE preventative_completions ADD COLUMN new_prev_id TEXT;
    END IF;
  END IF;
END$$;

-- 4) Populate tasks.new_task_id from daily_tasks/preventatives based on current id
UPDATE tasks t
SET new_task_id = dt.new_id
FROM daily_tasks dt
WHERE t.task_type = 'daily' AND t.id::text = dt.id::text AND (t.new_task_id IS NULL OR t.new_task_id <> dt.new_id);

UPDATE tasks t
SET new_task_id = pr.new_id
FROM preventatives pr
WHERE t.task_type = 'preventative' AND t.id::text = pr.id::text AND (t.new_task_id IS NULL OR t.new_task_id <> pr.new_id);

-- 5) Populate task_completions.new_task_id via tasks mapping
UPDATE task_completions tc
SET new_task_id = t.new_task_id
FROM tasks t
WHERE tc.task_id::text = t.id::text AND (tc.new_task_id IS NULL OR tc.new_task_id <> t.new_task_id);

-- 6) Populate preventative_completions.new_prev_id via preventatives mapping (if table exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name='preventative_completions'
  ) THEN
    UPDATE preventative_completions pc
    SET new_prev_id = pr.new_id
    FROM preventatives pr
    WHERE pc.preventative_id::text = pr.id::text AND (pc.new_prev_id IS NULL OR pc.new_prev_id <> pr.new_id);
  END IF;
END$$;

-- 7) Drop FKs that depend on old types
DO $$
BEGIN
  -- task_completions -> tasks FK name may vary; drop by discovering
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_type='FOREIGN KEY' AND constraint_name='task_completions_task_id_fkey'
  ) THEN
    ALTER TABLE task_completions DROP CONSTRAINT task_completions_task_id_fkey;
  END IF;
EXCEPTION WHEN undefined_table THEN
  -- ignore
END$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_type='FOREIGN KEY' AND constraint_name='preventative_completions_preventative_id_fkey'
  ) THEN
    ALTER TABLE preventative_completions DROP CONSTRAINT preventative_completions_preventative_id_fkey;
  END IF;
EXCEPTION WHEN undefined_table THEN
END$$;

-- 8) Switch primary key columns to TEXT and move values
-- daily_tasks
ALTER TABLE daily_tasks DROP CONSTRAINT IF EXISTS daily_tasks_pkey;
ALTER TABLE daily_tasks ALTER COLUMN id TYPE TEXT USING id::text;
UPDATE daily_tasks SET id = new_id;
ALTER TABLE daily_tasks ALTER COLUMN id SET NOT NULL;
ALTER TABLE daily_tasks ADD PRIMARY KEY (id);
-- Set default to prefixed UUID for future inserts
ALTER TABLE daily_tasks ALTER COLUMN id SET DEFAULT 'd_' || gen_random_uuid()::text;
ALTER TABLE daily_tasks DROP COLUMN new_id;

-- preventatives
ALTER TABLE preventatives DROP CONSTRAINT IF EXISTS preventatives_pkey;
ALTER TABLE preventatives ALTER COLUMN id TYPE TEXT USING id::text;
UPDATE preventatives SET id = new_id;
ALTER TABLE preventatives ALTER COLUMN id SET NOT NULL;
ALTER TABLE preventatives ADD PRIMARY KEY (id);
-- Set default to prefixed UUID for future inserts
ALTER TABLE preventatives ALTER COLUMN id SET DEFAULT 'p_' || gen_random_uuid()::text;
ALTER TABLE preventatives DROP COLUMN new_id;

-- 9) Update tasks table id type and values
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_pkey;
-- Drop numeric range check if present
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_id_range_check;
ALTER TABLE tasks ALTER COLUMN id TYPE TEXT USING id::text;
UPDATE tasks SET id = new_task_id WHERE new_task_id IS NOT NULL;
ALTER TABLE tasks ALTER COLUMN id SET NOT NULL;
ALTER TABLE tasks ADD PRIMARY KEY (id);
ALTER TABLE tasks DROP COLUMN new_task_id;

-- 10) Update task_completions.task_id type and values
ALTER TABLE task_completions ALTER COLUMN task_id TYPE TEXT USING task_id::text;
UPDATE task_completions SET task_id = new_task_id WHERE new_task_id IS NOT NULL;
ALTER TABLE task_completions ALTER COLUMN task_id SET NOT NULL;
ALTER TABLE task_completions DROP COLUMN new_task_id;

-- 11) Update preventative_completions.preventative_id type and values (if table exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name='preventative_completions'
  ) THEN
    ALTER TABLE preventative_completions ALTER COLUMN preventative_id TYPE TEXT USING preventative_id::text;
    UPDATE preventative_completions SET preventative_id = new_prev_id WHERE new_prev_id IS NOT NULL;
    ALTER TABLE preventative_completions ALTER COLUMN preventative_id SET NOT NULL;
    ALTER TABLE preventative_completions DROP COLUMN new_prev_id;
  END IF;
END$$;

-- 12) Recreate foreign keys
ALTER TABLE task_completions
  ADD CONSTRAINT task_completions_task_id_fkey
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name='preventative_completions'
  ) THEN
    ALTER TABLE preventative_completions
      ADD CONSTRAINT preventative_completions_preventative_id_fkey
      FOREIGN KEY (preventative_id) REFERENCES preventatives(id) ON DELETE CASCADE;
  END IF;
END$$;

COMMIT;
