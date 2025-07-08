-- Create preventative completions table
CREATE TABLE IF NOT EXISTS preventative_completions (
  id SERIAL PRIMARY KEY,
  original_preventative_id INTEGER NOT NULL REFERENCES preventatives(id) ON DELETE CASCADE,
  completion_date DATE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(original_preventative_id, completion_date)
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_preventative_completions_date 
  ON preventative_completions(completion_date);

-- Add index for faster joins
CREATE INDEX IF NOT EXISTS idx_preventative_completions_preventative 
  ON preventative_completions(original_preventative_id);
