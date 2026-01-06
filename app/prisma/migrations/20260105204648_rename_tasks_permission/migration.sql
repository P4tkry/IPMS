-- Add new permission for task management
ALTER TYPE "ProjectPermission" ADD VALUE IF NOT EXISTS 'TASKS_CUD';
