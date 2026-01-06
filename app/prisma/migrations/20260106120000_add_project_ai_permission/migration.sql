-- Add AI use permission for project members.
ALTER TYPE "ProjectPermission" ADD VALUE IF NOT EXISTS 'AI_USE';
