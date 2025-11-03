-- Make user_id columns NOT NULL for improved security
ALTER TABLE "Sales" 
  ALTER COLUMN "User_id" SET NOT NULL;

ALTER TABLE "Inventory" 
  ALTER COLUMN user_id SET NOT NULL;

-- Make other critical columns NOT NULL with sensible defaults
ALTER TABLE "Sales"
  ALTER COLUMN "Date" SET DEFAULT CURRENT_DATE,
  ALTER COLUMN "Date" SET NOT NULL,
  ALTER COLUMN "Amount" SET DEFAULT 0,
  ALTER COLUMN "Amount" SET NOT NULL,
  ALTER COLUMN "Quantity" SET DEFAULT 1,
  ALTER COLUMN "Quantity" SET NOT NULL;

ALTER TABLE "Inventory"
  ALTER COLUMN "Stock quantity" SET DEFAULT 0,
  ALTER COLUMN "Stock quantity" SET NOT NULL,
  ALTER COLUMN "Price_per_unit" SET DEFAULT 0,
  ALTER COLUMN "Price_per_unit" SET NOT NULL;