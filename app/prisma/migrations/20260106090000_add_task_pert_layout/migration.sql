-- Add persisted PERT layout coordinates for tasks.
ALTER TABLE "Task" ADD COLUMN "pertX" DOUBLE PRECISION;
ALTER TABLE "Task" ADD COLUMN "pertY" DOUBLE PRECISION;
