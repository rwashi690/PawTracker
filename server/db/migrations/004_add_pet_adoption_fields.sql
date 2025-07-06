-- Add adoption and working dog fields to pets table
ALTER TABLE pets
ADD COLUMN IF NOT EXISTS is_adopted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS adoption_date DATE,
ADD COLUMN IF NOT EXISTS is_working_dog BOOLEAN DEFAULT FALSE;

-- Create a trigger to ensure adoption_date is set when is_adopted is true
CREATE OR REPLACE FUNCTION check_adoption_date()
RETURNS TRIGGER AS $$
BEGIN
    -- If setting is_adopted to true and adoption_date is null, set it to current date
    IF NEW.is_adopted = TRUE AND NEW.adoption_date IS NULL THEN
        NEW.adoption_date = CURRENT_DATE;
    END IF;

    -- If setting is_adopted to false, clear the adoption date
    IF NEW.is_adopted = FALSE THEN
        NEW.adoption_date = NULL;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to pets table
DROP TRIGGER IF EXISTS check_pet_adoption_date ON pets;
CREATE TRIGGER check_pet_adoption_date
    BEFORE INSERT OR UPDATE ON pets
    FOR EACH ROW
    EXECUTE FUNCTION check_adoption_date();

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_pets_is_adopted ON pets(is_adopted);
CREATE INDEX IF NOT EXISTS idx_pets_is_working_dog ON pets(is_working_dog);
