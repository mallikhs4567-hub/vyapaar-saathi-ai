-- Create bills/invoices table
CREATE TABLE public.bills (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  bill_number TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_email TEXT,
  customer_address TEXT,
  bill_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  tax_percentage NUMERIC NOT NULL DEFAULT 0,
  tax_amount NUMERIC NOT NULL DEFAULT 0,
  discount_amount NUMERIC NOT NULL DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  paid_amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'unpaid',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT bills_status_check CHECK (status IN ('paid', 'unpaid', 'partial', 'cancelled'))
);

-- Create bill_items table for line items
CREATE TABLE public.bill_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bill_id UUID NOT NULL REFERENCES public.bills(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  description TEXT,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  total_price NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bills
CREATE POLICY "Users can view their own bills"
  ON public.bills FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bills"
  ON public.bills FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bills"
  ON public.bills FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bills"
  ON public.bills FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for bill_items
CREATE POLICY "Users can view their own bill items"
  ON public.bill_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.bills 
    WHERE bills.id = bill_items.bill_id 
    AND bills.user_id = auth.uid()
  ));

CREATE POLICY "Users can create their own bill items"
  ON public.bill_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.bills 
    WHERE bills.id = bill_items.bill_id 
    AND bills.user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own bill items"
  ON public.bill_items FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.bills 
    WHERE bills.id = bill_items.bill_id 
    AND bills.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own bill items"
  ON public.bill_items FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.bills 
    WHERE bills.id = bill_items.bill_id 
    AND bills.user_id = auth.uid()
  ));

-- Create trigger for updated_at
CREATE TRIGGER update_bills_updated_at
  BEFORE UPDATE ON public.bills
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_bills_user_id ON public.bills(user_id);
CREATE INDEX idx_bills_status ON public.bills(status);
CREATE INDEX idx_bills_bill_number ON public.bills(bill_number);
CREATE INDEX idx_bill_items_bill_id ON public.bill_items(bill_id);