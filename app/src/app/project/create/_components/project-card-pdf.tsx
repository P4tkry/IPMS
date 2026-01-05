import { Document, Font, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { ProjectPayload, StakeholderEntry } from "./types";

Font.register({
  family: "NotoSans",
  fonts: [
    { src: "/fonts/NotoSans-Regular.ttf", fontWeight: 400 },
    { src: "/fonts/NotoSans-Bold.ttf", fontWeight: 700 },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 48,
    fontFamily: "NotoSans",
    fontSize: 10,
    color: "#1f1a15",
  },
  header: {
    marginBottom: 16,
  },
  kicker: {
    fontSize: 9,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "#8d7b68",
    marginBottom: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: "#5b5044",
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#d7c8b7",
    marginTop: 12,
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
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 9,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: "#8d7b68",
    marginBottom: 8,
  },
  sectionBlock: {
    marginBottom: 6,
  },
  item: {
    marginBottom: 8,
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
    height: 220,
    marginTop: 8,
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

const joinOrEmpty = (items: string[], empty: string) =>
  items.length ? items.join("\n") : empty;

const formatTerms = (terms: ProjectPayload["terms"] | undefined, empty: string) => {
  if (!terms || !terms.length) {
    return empty;
  }
  return terms.map((term) => `${term.date} - ${term.description}`).join("\n");
};

function StakeholderMap({
  axisPower,
  axisInterest,
  quadrants,
}: {
  axisPower: string;
  axisInterest: string;
  quadrants: ProjectCardPdfStrings["stakeholdersMap"]["quadrants"];
}) {
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
  const stakeholders = values.stakeholderEntries ?? [];
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.kicker}>{strings.kicker}</Text>
          <Text style={styles.title}>{strings.title}</Text>
          <Text style={styles.subtitle}>{strings.subtitle}</Text>
          <View style={styles.divider} />
        </View>

        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>{strings.sections.basics}</Text>
          <View style={styles.item} wrap={false}>
            <Text style={styles.label}>{strings.fields.name}</Text>
            <Text style={styles.value}>{values.name || strings.empty}</Text>
          </View>
          <View style={styles.item} wrap={false}>
            <Text style={styles.label}>{strings.fields.category}</Text>
            <Text style={styles.value}>{values.category || strings.empty}</Text>
          </View>
        </View>

        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>{strings.sections.vision}</Text>
          <View style={styles.item} wrap={false}>
            <Text style={styles.label}>{strings.fields.goal}</Text>
            <Text style={styles.value}>{values.goal || strings.empty}</Text>
          </View>
          <View style={styles.item} wrap={false}>
            <Text style={styles.label}>{strings.fields.outcome}</Text>
            <Text style={styles.value}>{values.outcome || strings.empty}</Text>
          </View>
          <View style={styles.sectionBlock} wrap={false}>
            <Text style={styles.label}>{strings.fields.stakeholders}</Text>
            <StakeholderMap
              axisPower={strings.stakeholdersMap.axisPower}
              axisInterest={strings.stakeholdersMap.axisInterest}
              quadrants={strings.stakeholdersMap.quadrants}
            />
          </View>
          <View style={styles.item} wrap={false}>
            <Text style={styles.label}>{strings.fields.justification}</Text>
            <Text style={styles.value}>{values.justification || strings.empty}</Text>
          </View>
        </View>

        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>{strings.sections.direction}</Text>
          <View style={styles.item} wrap={false}>
            <Text style={styles.label}>{strings.fields.scopeIn}</Text>
            <Text style={styles.value}>
              {joinOrEmpty(values.inScope ?? [], strings.empty)}
            </Text>
          </View>
          <View style={styles.item} wrap={false}>
            <Text style={styles.label}>{strings.fields.scopeOut}</Text>
            <Text style={styles.value}>
              {joinOrEmpty(values.outScope ?? [], strings.empty)}
            </Text>
          </View>
          <View style={styles.item} wrap={false}>
            <Text style={styles.label}>{strings.fields.kpis}</Text>
            <Text style={styles.value}>{joinOrEmpty(values.kpis ?? [], strings.empty)}</Text>
          </View>
          <View style={styles.item} wrap={false}>
            <Text style={styles.label}>{strings.fields.milestones}</Text>
            <Text style={styles.value}>
              {joinOrEmpty(values.milestones ?? [], strings.empty)}
            </Text>
          </View>
        </View>

        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>{strings.sections.resources}</Text>
          <View style={styles.item} wrap={false}>
            <Text style={styles.label}>{strings.fields.peopleHigh}</Text>
            <Text style={styles.value}>{values.peopleHighAvailability ?? 0}</Text>
          </View>
          <View style={styles.item} wrap={false}>
            <Text style={styles.label}>{strings.fields.peopleLow}</Text>
            <Text style={styles.value}>{values.peopleLowAvailability ?? 0}</Text>
          </View>
          <View style={styles.item} wrap={false}>
            <Text style={styles.label}>{strings.fields.budget}</Text>
            <Text style={styles.value}>{values.budget ?? 0}</Text>
          </View>
        </View>

        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>{strings.sections.wrapup}</Text>
          <View style={styles.item} wrap={false}>
            <Text style={styles.label}>{strings.fields.chances}</Text>
            <Text style={styles.value}>{joinOrEmpty(values.chances ?? [], strings.empty)}</Text>
          </View>
          <View style={styles.item} wrap={false}>
            <Text style={styles.label}>{strings.fields.threats}</Text>
            <Text style={styles.value}>{joinOrEmpty(values.threats ?? [], strings.empty)}</Text>
          </View>
          <View style={styles.item} wrap={false}>
            <Text style={styles.label}>{strings.fields.terms}</Text>
            <Text style={styles.value}>{formatTerms(values.terms, strings.empty)}</Text>
          </View>
        </View>

        {/* Signature/date block */}
        <View style={{ marginTop: 12 }}>
          <View style={{ borderTopWidth: 1, borderTopColor: "#d7c8b7", marginTop: 12 }} />
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>{strings.footer.dateLabel}</Text>
              <View style={{ borderBottomWidth: 1, borderBottomColor: "#d7c8b7", height: 20 }} />
            </View>
            <View style={{ flex: 1, marginLeft: 20 }}>
              <Text style={styles.label}>{strings.footer.signatureLabel}</Text>
              <View style={{ borderBottomWidth: 1, borderBottomColor: "#d7c8b7", height: 20 }} />
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
