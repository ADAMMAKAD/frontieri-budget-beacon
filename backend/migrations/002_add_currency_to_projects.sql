-- Add currency column to projects table
ALTER TABLE public.projects 
ADD COLUMN currency text DEFAULT 'USD' CHECK (currency IN ('USD', 'ETB'));

-- Update existing projects to have USD as default currency
UPDATE public.projects SET currency = 'USD' WHERE currency IS NULL;