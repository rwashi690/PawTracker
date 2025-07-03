-- Create daily tasks table
CREATE TABLE IF NOT EXISTS daily_tasks (
  id SERIAL PRIMARY KEY,
  pet_id INTEGER NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  task_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_pet
    FOREIGN KEY(pet_id)
    REFERENCES pets(id)
    ON DELETE CASCADE
);

-- Create task completions table to track daily completions
CREATE TABLE IF NOT EXISTS task_completions (
  id SERIAL PRIMARY KEY,
  task_id INTEGER NOT NULL REFERENCES daily_tasks(id) ON DELETE CASCADE,
  completion_date DATE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_task
    FOREIGN KEY(task_id)
    REFERENCES daily_tasks(id)
    ON DELETE CASCADE,
  -- Ensure we only have one completion per task per day
  CONSTRAINT unique_task_completion_per_day UNIQUE(task_id, completion_date)
);

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_daily_tasks_pet_id ON daily_tasks(pet_id);
CREATE INDEX IF NOT EXISTS idx_task_completions_task_id ON task_completions(task_id);
CREATE INDEX IF NOT EXISTS idx_task_completions_date ON task_completions(completion_date);

-- Add trigger to update updated_at timestamp for daily_tasks
CREATE OR REPLACE FUNCTION update_daily_tasks_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_daily_tasks_updated_at
    BEFORE UPDATE ON daily_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_daily_tasks_updated_at_column();
