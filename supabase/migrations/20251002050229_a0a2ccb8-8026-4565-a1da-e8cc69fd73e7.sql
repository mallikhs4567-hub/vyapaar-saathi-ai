-- Enable full replica identity for real-time updates
ALTER TABLE public."Sales" REPLICA IDENTITY FULL;
ALTER TABLE public."Inventory" REPLICA IDENTITY FULL;