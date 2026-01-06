import type { ReactNode } from "react";
import { Document, Font, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { ProjectPayload, StakeholderEntry } from "./types";

Font.register({
  family: "NotoSans",
  fonts: [
    { src: "/fonts/NotoSans-Regular.ttf", fontWeight: 400 },
    { src: "/fonts/NotoSans-Bold.ttf", fontWeight: 700 },
  ],
});

const MAP_WIDTH = 300;
const MAP_HEIGHT = 220;

const styles = StyleSheet.create({
  page: {
    padding: 48,
    fontFamily: "NotoSans",
    fontSize: 10,
    color: "#1f1a15",
  },
  header: {
    marginBottom: 20,
  },
  kicker: {
    fontSize: 9,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "#8d7b68",
    marginBottom: 6,
  },
  title: {
    fontSize: 26,
    fontWeight: 700,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 10,
    color: "#5b5044",
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#d7c8b7",
    marginTop: 14,
  },
  section: {
    marginTop: 18,
  },
  sectionTitle: {
    fontSize: 9,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: "#8d7b68",
    marginBottom: 10,
  },
  sectionBody: {
    gap: 8,
  },
  item: {
    marginBottom: 6,
  },
  label: {
    fontSize: 9,
    fontWeight: 700,
    color: "#2a241f",
    marginBottom: 2,
  },
  value: {
    fontSize: 10,
    color: "#3a2f25",
    lineHeight: 1.4,
  },
  mapLabel: {
    fontSize: 8,
    color: "#8d7b68",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  mapWrap: {
    borderWidth: 1,
    borderColor: "#d7c8b7",
    height: MAP_HEIGHT,
    width: MAP_WIDTH,
    marginTop: 8,
    position: "relative",
  },
  mapRow: {
    flexDirection: "row",
    flex: 1,
  },
  mapCell: {
    flex: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#d7c8b7",
    padding: 6,
  },
  mapCellLastColumn: {
    borderRightWidth: 0,
  },
  mapCellLastRow: {
    borderBottomWidth: 0,
  },
  mapCellText: {
    fontSize: 8,
    color: "#6f6255",
  },
  mapPointsLayer: {
    position: "absolute",
    top: 0,
    left: 0,
    width: MAP_WIDTH,
    height: MAP_HEIGHT,
  },
  mapPoint: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingLeft: 4,
    paddingRight: 4,
    paddingTop: 2,
    paddingBottom: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e7dccf",
    marginLeft: -8,
    marginTop: -8,
  },
  mapPointDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#2a241f",
    marginRight: 4,
  },
  mapPointLabel: {
    fontSize: 7.5,
    color: "#2a241f",
  },
  mapEmpty: {
    position: "absolute",
    top: MAP_HEIGHT / 2 - 6,
    left: 12,
    right: 12,
    textAlign: "center",
    fontSize: 8,
    color: "#8d7b68",
  },
  signatureBlock: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  signatureItem: {
    flex: 1,
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: "#d7c8b7",
    height: 20,
    marginTop: 6,
  },
  footer: {
    position: "absolute",
    right: 32,
    bottom: 20,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  footerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#f59e0b",
  },
  footerText: {
    fontSize: 8,
    color: "#6f6255",
    letterSpacing: 0.4,
  },
});

type ProjectCardPdfStrings = {
  kicker: string;
  title: string;
  subtitle: string;
  sections: {
    basics: string;
    vision: string;
    direction: string;
    resources: string;
    wrapup: string;
  };
  fields: {
    name: string;
    category: string;
    goal: string;
    outcome: string;
    stakeholders: string;
    justification: string;
    scopeIn: string;
    scopeOut: string;
    kpis: string;
    milestones: string;
    chances: string;
    threats: string;
    terms: string;
    peopleHigh: string;
    peopleLow: string;
    budget: string;
  };
  stakeholdersMap: {
    axisPower: string;
    axisInterest: string;
    quadrants: {
      highLow: string;
      highHigh: string;
      lowLow: string;
      lowHigh: string;
    };
  };
  empty: string;
  footer: {
    poweredBy: string;
    dateLabel: string;
    signatureLabel: string;
  };
};

type NormalizedStakeholder = {
  name: string;
  interest: number;
  power: number;
};

const clampScore = (value?: number) => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return 0;
  }
  return Math.max(0, Math.min(10, value));
};

const formatBulletList = (items: string[] | undefined, empty: string) => {
  if (!items || items.length === 0) {
    return empty;
  }
  return items.map((item) => `• ${item}`).join("\n");
};

const formatTerms = (terms: ProjectPayload["terms"] | undefined, empty: string) => {
  if (!terms || terms.length === 0) {
    return empty;
  }
  return terms
    .map((term) => {
      const date = term.date?.trim() || "";
      const description = term.description?.trim() || "";
      if (!date && !description) {
        return null;
      }
      return `• ${date}${date && description ? " – " : ""}${description}`;
    })
    .filter(Boolean)
    .join("\n");
};

const normalizeStakeholders = (entries?: StakeholderEntry[]): NormalizedStakeholder[] => {
  if (!Array.isArray(entries)) {
    return [];
  }
  return entries
    .map((entry) => ({
      name: entry.name?.trim() || "",
      interest: clampScore(entry.interest),
      power: clampScore(entry.power),
    }))
    .filter((entry) => entry.name.length > 0);
};

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <View style={styles.section} wrap={false}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.sectionBody}>{children}</View>
  </View>
);

const Field = ({ label, value }: { label: string; value: string | number }) => (
  <View style={styles.item} wrap={false}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value === "" ? "—" : value}</Text>
  </View>
);

function StakeholderMap({
  axisPower,
  axisInterest,
  quadrants,
  entries,
  emptyLabel,
}: {
  axisPower: string;
  axisInterest: string;
  quadrants: ProjectCardPdfStrings["stakeholdersMap"]["quadrants"];
  entries: NormalizedStakeholder[];
  emptyLabel: string;
}) {
  const normalized = normalizeStakeholders(entries);
  return (
    <View>
      <Text style={styles.mapLabel}>{axisInterest}</Text>
      <View style={styles.mapWrap}>
        <View style={styles.mapRow}>
          <View style={styles.mapCell}>
            <Text style={styles.mapCellText}>{quadrants.highLow}</Text>
          </View>
          <View style={[styles.mapCell, styles.mapCellLastColumn]}>
            <Text style={styles.mapCellText}>{quadrants.highHigh}</Text>
          </View>
        </View>
        <View style={styles.mapRow}>
          <View style={[styles.mapCell, styles.mapCellLastRow]}>
            <Text style={styles.mapCellText}>{quadrants.lowLow}</Text>
          </View>
          <View
            style={[styles.mapCell, styles.mapCellLastColumn, styles.mapCellLastRow]}
          >
            <Text style={styles.mapCellText}>{quadrants.lowHigh}</Text>
          </View>
        </View>
        {normalized.length === 0 ? (
          <Text style={styles.mapEmpty}>{emptyLabel}</Text>
        ) : (
          <View style={styles.mapPointsLayer}>
            {normalized.map((entry) => {
              const left = (entry.power / 10) * MAP_WIDTH;
              const top = MAP_HEIGHT - (entry.interest / 10) * MAP_HEIGHT;
              return (
                <View
                  key={`${entry.name}-${entry.power}-${entry.interest}`}
                  style={[styles.mapPoint, { left, top }]}
                >
                  <View style={styles.mapPointDot} />
                  <Text style={styles.mapPointLabel}>{entry.name}</Text>
                </View>
              );
            })}
          </View>
        )}
      </View>
      <Text style={[styles.mapLabel, { marginTop: 6 }]}>{axisPower}</Text>
    </View>
  );
}

export function ProjectCardPdfDocument({
  values,
  strings,
}: {
  values: ProjectPayload;
  strings: ProjectCardPdfStrings;
}) {
  const stakeholders = normalizeStakeholders(values.stakeholderEntries);
  const nameValue = values.name || strings.empty;
  const categoryValue = values.category || strings.empty;
  const goalValue = values.goal || strings.empty;
  const outcomeValue = values.outcome || strings.empty;
  const justificationValue = values.justification || strings.empty;
  const scopeInValue = formatBulletList(values.inScope, strings.empty);
  const scopeOutValue = formatBulletList(values.outScope, strings.empty);
  const kpiValue = formatBulletList(values.kpis, strings.empty);
  const milestonesValue = formatBulletList(values.milestones, strings.empty);
  const chancesValue = formatBulletList(values.chances, strings.empty);
  const threatsValue = formatBulletList(values.threats, strings.empty);
  const termsValue = formatTerms(values.terms, strings.empty) || strings.empty;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.kicker}>{strings.kicker}</Text>
          <Text style={styles.title}>{strings.title}</Text>
          <Text style={styles.subtitle}>{strings.subtitle}</Text>
          <View style={styles.divider} />
        </View>

        <Section title={strings.sections.basics}>
          <Field label={strings.fields.name} value={nameValue} />
          <Field label={strings.fields.category} value={categoryValue} />
        </Section>

        <Section title={strings.sections.vision}>
          <Field label={strings.fields.goal} value={goalValue} />
          <Field label={strings.fields.outcome} value={outcomeValue} />
          <View style={styles.item} wrap={false}>
            <Text style={styles.label}>{strings.fields.stakeholders}</Text>
            <StakeholderMap
              axisPower={strings.stakeholdersMap.axisPower}
              axisInterest={strings.stakeholdersMap.axisInterest}
              quadrants={strings.stakeholdersMap.quadrants}
              entries={stakeholders}
              emptyLabel={strings.empty}
            />
          </View>
          <Field label={strings.fields.justification} value={justificationValue} />
        </Section>

        <Section title={strings.sections.direction}>
          <Field label={strings.fields.scopeIn} value={scopeInValue} />
          <Field label={strings.fields.scopeOut} value={scopeOutValue} />
          <Field label={strings.fields.kpis} value={kpiValue} />
          <Field label={strings.fields.milestones} value={milestonesValue} />
        </Section>

        <Section title={strings.sections.resources}>
          <Field
            label={strings.fields.peopleHigh}
            value={values.peopleHighAvailability ?? 0}
          />
          <Field
            label={strings.fields.peopleLow}
            value={values.peopleLowAvailability ?? 0}
          />
          <Field label={strings.fields.budget} value={values.budget ?? 0} />
        </Section>

        <Section title={strings.sections.wrapup}>
          <Field label={strings.fields.chances} value={chancesValue} />
          <Field label={strings.fields.threats} value={threatsValue} />
          <Field label={strings.fields.terms} value={termsValue} />
        </Section>

        <View style={{ marginTop: 14 }}>
          <View style={styles.divider} />
          <View style={styles.signatureBlock}>
            <View style={[styles.signatureItem, { marginRight: 18 }]}>
              <Text style={styles.label}>{strings.footer.dateLabel}</Text>
              <View style={styles.signatureLine} />
            </View>
            <View style={styles.signatureItem}>
              <Text style={styles.label}>{strings.footer.signatureLabel}</Text>
              <View style={styles.signatureLine} />
            </View>
          </View>
        </View>

        <View style={styles.footer} fixed>
          <View style={styles.footerRow}>
            <View style={styles.footerDot} />
            <Text style={styles.footerText}>{strings.footer.poweredBy}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
