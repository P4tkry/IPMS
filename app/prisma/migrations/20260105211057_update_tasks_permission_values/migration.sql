-- Replace legacy task permission code with the new value
UPDATE "ProjectMember"
SET permissions = array_replace(permissions, 'TASKS_CREATE', 'TASKS_CUD');
