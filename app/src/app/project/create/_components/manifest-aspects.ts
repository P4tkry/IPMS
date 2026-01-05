export type ExpertCallout = {
  label: string;
  text: string;
};

export type ExpertExampleGroup = {
  title: string;
  items: string[];
};

export type ExpertExampleText = {
  title: string;
  text: string;
};

export type ExpertBlock = {
  paragraphs?: string[];
  bullets?: string[];
  callouts?: ExpertCallout[];
  examples?: ExpertExampleGroup[];
  exampleTexts?: ExpertExampleText[];
};

export type ManifestAspect = {
  slug: string;
  title: string;
  question: string;
  expert: ExpertBlock;
};

export type TranslateFn = (key: string) => string;

export const manifestAspectSlugs = [
  "name",
  "category",
  "goal",
  "outcome",
  "stakeholders",
  "justification",
  "mvp",
  "scope-in",
  "scope-out",
  "kpi",
  "milestones",
  "people",
  "budget",
  "chances",
  "threats",
  "terms",
] as const;

export const buildManifestAspects = (t: TranslateFn): ManifestAspect[] => {
  const scopeExpert: ExpertBlock = {
    paragraphs: [
      t("project.create.scope.expert.body1"),
      t("project.create.scope.expert.body2"),
    ],
    exampleTexts: [
      {
        title: t("project.create.scope.expert.exampleTitle"),
        text: t("project.create.scope.expert.exampleProject"),
      },
      {
        title: t("project.create.scope.expert.exampleInTitle"),
        text: t("project.create.scope.expert.exampleIn"),
      },
      {
        title: t("project.create.scope.expert.exampleOutTitle"),
        text: t("project.create.scope.expert.exampleOut"),
      },
    ],
  };

  return [
    {
      slug: "name",
      title: t("project.create.print.labels.name"),
      question: t("project.create.questions.name"),
      expert: {
        paragraphs: [
          t("project.create.name.expert.body1"),
          t("project.create.name.expert.body2"),
        ],
        bullets: [
          t("project.create.name.expert.list1"),
          t("project.create.name.expert.list2"),
        ],
      },
    },
    {
      slug: "category",
      title: t("project.create.print.labels.category"),
      question: t("project.create.questions.category"),
      expert: {
        paragraphs: [t("project.create.category.expert.body")],
      },
    },
    {
      slug: "goal",
      title: t("project.create.print.labels.goal"),
      question: t("project.create.questions.goal"),
      expert: {
        paragraphs: [t("project.create.goal.expert.body")],
        callouts: [
          {
            label: t("project.create.goal.expert.projectLabel"),
            text: t("project.create.goal.expert.projectText"),
          },
          {
            label: t("project.create.goal.expert.goalLabel"),
            text: t("project.create.goal.expert.goalText"),
          },
        ],
        examples: [
          {
            title: t("project.create.goal.examples.goodTitle"),
            items: [
              t("project.create.goal.examples.good.1"),
              t("project.create.goal.examples.good.2"),
              t("project.create.goal.examples.good.3"),
              t("project.create.goal.examples.good.4"),
            ],
          },
          {
            title: t("project.create.goal.examples.badTitle"),
            items: [
              t("project.create.goal.examples.bad.1"),
              t("project.create.goal.examples.bad.2"),
              t("project.create.goal.examples.bad.3"),
            ],
          },
        ],
      },
    },
    {
      slug: "outcome",
      title: t("project.create.print.labels.outcome"),
      question: t("project.create.questions.outcome"),
      expert: {
        paragraphs: [
          t("project.create.outcome.expert.body1"),
          t("project.create.outcome.expert.body2"),
          t("project.create.outcome.expert.body3"),
        ],
        examples: [
          {
            title: t("project.create.outcome.examples.title"),
            items: [
              t("project.create.outcome.examples.1"),
              t("project.create.outcome.examples.2"),
              t("project.create.outcome.examples.3"),
              t("project.create.outcome.examples.4"),
            ],
          },
        ],
      },
    },
    {
      slug: "stakeholders",
      title: t("project.create.print.labels.stakeholders"),
      question: t("project.create.questions.stakeholders"),
      expert: {
        paragraphs: [
          t("project.create.stakeholders.expert.body1"),
          t("project.create.stakeholders.expert.body2"),
          t("project.create.stakeholders.expert.body3"),
        ],
        bullets: [
          t("project.create.stakeholders.expert.list1"),
          t("project.create.stakeholders.expert.list2"),
        ],
      },
    },
    {
      slug: "justification",
      title: t("project.create.print.labels.justification"),
      question: t("project.create.questions.justification"),
      expert: {
        paragraphs: [t("project.create.justification.expert.body1")],
        examples: [
          {
            title: t("project.create.justification.expert.examplesTitle"),
            items: [
              t("project.create.justification.expert.examples.1"),
              t("project.create.justification.expert.examples.2"),
              t("project.create.justification.expert.examples.3"),
              t("project.create.justification.expert.examples.4"),
            ],
          },
        ],
      },
    },
    {
      slug: "mvp",
      title: t("project.create.print.labels.mvp"),
      question: t("project.create.questions.mvp"),
      expert: {
        paragraphs: [
          t("project.create.mvp.expert.body1"),
          t("project.create.mvp.expert.body2"),
        ],
        examples: [
          {
            title: t("project.create.mvp.expert.examplesTitle"),
            items: [
              t("project.create.mvp.expert.examples.1"),
              t("project.create.mvp.expert.examples.2"),
              t("project.create.mvp.expert.examples.3"),
            ],
          },
        ],
      },
    },
    {
      slug: "scope-in",
      title: t("project.create.print.labels.scopeIn"),
      question: t("project.create.questions.scopeIn"),
      expert: scopeExpert,
    },
    {
      slug: "scope-out",
      title: t("project.create.print.labels.scopeOut"),
      question: t("project.create.questions.scopeOut"),
      expert: scopeExpert,
    },
    {
      slug: "kpi",
      title: t("project.create.print.labels.kpi"),
      question: t("project.create.questions.kpi"),
      expert: {
        paragraphs: [
          t("project.create.kpi.expert.body1"),
          t("project.create.kpi.expert.body2"),
        ],
        examples: [
          {
            title: t("project.create.kpi.expert.examplesTitle"),
            items: [
              t("project.create.kpi.expert.examples.1"),
              t("project.create.kpi.expert.examples.2"),
              t("project.create.kpi.expert.examples.3"),
            ],
          },
        ],
      },
    },
    {
      slug: "milestones",
      title: t("project.create.print.labels.milestones"),
      question: t("project.create.questions.milestones"),
      expert: {
        paragraphs: [
          t("project.create.milestones.expert.body1"),
          t("project.create.milestones.expert.body2"),
        ],
        examples: [
          {
            title: t("project.create.milestones.expert.examplesTitle"),
            items: [
              t("project.create.milestones.expert.examples.1"),
              t("project.create.milestones.expert.examples.2"),
              t("project.create.milestones.expert.examples.3"),
            ],
          },
        ],
      },
    },
    {
      slug: "people",
      title: t("project.create.print.labels.people"),
      question: t("project.create.questions.people"),
      expert: {
        paragraphs: [
          t("project.create.people.expert.body1"),
          t("project.create.people.expert.body2"),
        ],
      },
    },
    {
      slug: "budget",
      title: t("project.create.print.labels.budget"),
      question: t("project.create.questions.budget"),
      expert: {
        paragraphs: [
          t("project.create.budget.expert.body1"),
          t("project.create.budget.expert.body2"),
        ],
        exampleTexts: [
          {
            title: t("project.create.budget.expert.exampleTitle"),
            text: t("project.create.budget.expert.example"),
          },
        ],
      },
    },
    {
      slug: "chances",
      title: t("project.create.print.labels.chances"),
      question: t("project.create.questions.chances"),
      expert: {
        paragraphs: [
          t("project.create.chances.expert.body1"),
          t("project.create.chances.expert.body2"),
        ],
        examples: [
          {
            title: t("project.create.chances.expert.examplesTitle"),
            items: [
              t("project.create.chances.expert.examples.1"),
              t("project.create.chances.expert.examples.2"),
              t("project.create.chances.expert.examples.3"),
            ],
          },
        ],
      },
    },
    {
      slug: "threats",
      title: t("project.create.print.labels.threats"),
      question: t("project.create.questions.threats"),
      expert: {
        paragraphs: [
          t("project.create.threats.expert.body1"),
          t("project.create.threats.expert.body2"),
        ],
        examples: [
          {
            title: t("project.create.threats.expert.examplesTitle"),
            items: [
              t("project.create.threats.expert.examples.1"),
              t("project.create.threats.expert.examples.2"),
              t("project.create.threats.expert.examples.3"),
            ],
          },
        ],
      },
    },
    {
      slug: "terms",
      title: t("project.create.print.labels.terms"),
      question: t("project.create.questions.terms"),
      expert: {
        paragraphs: [
          t("project.create.terms.expert.body1"),
          t("project.create.terms.expert.body2"),
        ],
        examples: [
          {
            title: t("project.create.terms.expert.examplesTitle"),
            items: [
              t("project.create.terms.expert.examples.1"),
              t("project.create.terms.expert.examples.2"),
              t("project.create.terms.expert.examples.3"),
            ],
          },
        ],
      },
    },
  ];
};
