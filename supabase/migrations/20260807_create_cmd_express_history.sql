-- Table definition for CMD Express History
CREATE TABLE IF NOT EXISTS public.cmd_express_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    express_number INTEGER NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    staff_name TEXT NOT NULL,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_qty INTEGER NOT NULL DEFAULT 0,
    pickup_date TEXT NOT NULL,
    pickup_time TEXT NOT NULL,
    notes TEXT,
    printed_time TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'processing',
    tracking_code TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add columns if table already exists
ALTER TABLE public.cmd_express_history 
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'processing';

ALTER TABLE public.cmd_express_history 
ADD COLUMN IF NOT EXISTS tracking_code TEXT;

-- Index for ordering by creation time (most recent first)
CREATE INDEX IF NOT EXISTS idx_cmd_express_history_created_at 
ON public.cmd_express_history (created_at DESC);

-- Index for searching express number & tracking code
CREATE INDEX IF NOT EXISTS idx_cmd_express_history_express_number 
ON public.cmd_express_history (express_number);

CREATE INDEX IF NOT EXISTS idx_cmd_express_history_tracking_code 
ON public.cmd_express_history (tracking_code);

-- Enable Row Level Security (RLS)
ALTER TABLE public.cmd_express_history ENABLE ROW LEVEL SECURITY;

-- Allow public access (anon key) for SELECT, INSERT, UPDATE, DELETE
CREATE POLICY "Allow public read and write access" 
ON public.cmd_express_history 
FOR ALL 
USING (true) 
WITH CHECK (true);
