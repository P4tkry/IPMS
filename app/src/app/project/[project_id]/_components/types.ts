export type ProjectInfo = {
  id: string;
  name: string | null;
  tradeName?: string | null;
  description: string | null;
  logo: string | null;
  isDraft: boolean;
  createdAt: string;
  updatedAt: string;
  canManageDashboard?: boolean;
  canPostDashboard?: boolean;
  category?: string | null;
  goal?: string | null;
  justification?: string | null;
  mvp?: string[] | null;
  kpis?: string[] | null;
  milestones?: string[] | null;
  chances?: string[] | null;
  threats?: string[] | null;
  terms?: { date: string | null; description: string | null }[] | null;
  inScope?: string[] | null;
  outScope?: string[] | null;
  peopleHighAvailability?: number | null;
  peopleLowAvailability?: number | null;
  budget?: number | null;
  canInvite?: boolean;
  canManageUsers?: boolean;
  pendingInvite?: boolean;
  isMember?: boolean;
  canViewTasks?: boolean;
  canCreateTasks?: boolean;
  canManageTasks?: boolean;
  canUseAi?: boolean;
  canUploadFiles?: boolean;
  canRemoveProject?: boolean;
  canEditProject?: boolean;
};

export type ProjectDashboardEntry = {
  id: string;
  title: string | null;
  content: string;
  tags?: string[];
  urgent?: boolean;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
};

export type TaskStatus =
  | "TODO"
  | "IN_PROGRESS"
  | "BLOCKED"
  | "READY_FOR_REVIEW"
  | "IN_REVIEW"
  | "DONE"
  | "REJECTED"
  | "CANCELLED";

export type TaskCategory = {
  id: string;
  name: string;
  code: string;
  color: string;
  icon?: string | null;
  description?: string | null;
  tasksCount?: number;
};

export type ProjectTask = {
  id: string;
  title: string;
  description?: string | null;
  deliveryGuidelines?: string | null;
  taskNumber: number;
  status: TaskStatus;
  deadline?: string | null;
  pertX?: number | null;
  pertY?: number | null;
  sprintId?: string | null;
  createdAt: string;
  updatedAt: string;
  assignedMember?: {
    id: string;
    user: {
      id: string;
      name: string | null;
      email: string | null;
      image: string | null;
    } | null;
  } | null;
  dependentTask?: {
    id: string;
    title: string | null;
    status?: TaskStatus;
  } | null;
  category?: TaskCategory | null;
};

export type Sprint = {
  id: string;
  name: string;
  sprintNumber: number;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
  tasks?: Array<{
    id: string;
    title: string;
    status: TaskStatus;
  }>;
};
