-- Create new enums for global and project-scoped permissions
CREATE TYPE "GlobalPermission" AS ENUM (
  'CREATE_USERS',
  'REMOVE_USERS',
  'UPDATE_USERS',
  'UPLOAD_PHOTOS',
  'UPLOAD_FILES',
  'CREATE_ALL_PROJECTS',
  'REMOVE_ALL_PROJECTS',
  'UPDATE_ALL_PROJECTS'
);

CREATE TYPE "ProjectPermission" AS ENUM (
  'USERS_MANAGE',
  'DASHBOARD_MANAGE',
  'DASHBOARD_POST',
  'TASK_VIEW',
  'TASKS_CREATE',
  'PROJECT_REMOVE',
  'PROJECT_EDIT'
);

-- Migrate User.permissions to GlobalPermission[]
ALTER TABLE "User"
ALTER COLUMN "permissions"
TYPE "GlobalPermission"[] USING ("permissions"::text::"GlobalPermission"[]);

-- Migrate ProjectMember.permissions to ProjectPermission[]
ALTER TABLE "ProjectMember"
ALTER COLUMN "permissions" DROP DEFAULT;
ALTER TABLE "ProjectMember"
ALTER COLUMN "permissions"
TYPE "ProjectPermission"[] USING ("permissions"::text::"ProjectPermission"[]);
ALTER TABLE "ProjectMember"
ALTER COLUMN "permissions" SET DEFAULT ARRAY[]::"ProjectPermission"[];

-- Clean up old enum
DROP TYPE "Permission";
