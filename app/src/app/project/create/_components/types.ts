export type StakeholderEntry = {
  name: string;
  interest: number;
  power: number;
};

export type ProjectPayload = {
  name?: string;
  category?: string;
  goal?: string;
  justification?: string;
  mvp?: string[];
  kpis?: string[];
  milestones?: string[];
  chances?: string[];
  threats?: string[];
  terms?: { date: string; description: string }[];
  stakeholderEntries?: StakeholderEntry[];
  inScope?: string[];
  outScope?: string[];
  peopleHighAvailability?: number;
  peopleLowAvailability?: number;
  budget?: number;
  outcome?: string;
};
