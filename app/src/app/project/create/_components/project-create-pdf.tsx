import { Document, Font, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { ManifestAspect } from "./manifest-aspects";

Font.register({
  family: "NotoSans",
  fonts: [
    { src: "/fonts/NotoSans-Regular.ttf", fontWeight: 400 },
    { src: "/fonts/NotoSans-Bold.ttf", fontWeight: 700 },
  ],
});

export type ProjectCreatePdfStrings = {
  kicker: string;
  title: string;
  description: string;
  subtitle: string;
  sections: {
    basics: string;
    vision: string;
    direction: string;
    resources: string;
    wrapup: string;
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
};

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
  description: {
    fontSize: 10,
    color: "#5b5044",
    marginTop: 4,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#d7c8b7",
    marginTop: 12,
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
  column: {
    flex: 1,
  },
  label: {
    fontSize: 9,
    fontWeight: 700,
    color: "#2a241f",
    marginBottom: 4,
  },
  question: {
    fontSize: 9,
    color: "#5b5044",
    marginBottom: 6,
    lineHeight: 1.4,
  },
  line: {
    borderBottomWidth: 1,
    borderBottomColor: "#d7c8b7",
    height: 16,
    marginBottom: 6,
  },
  lineTight: {
    borderBottomWidth: 1,
    borderBottomColor: "#d7c8b7",
    height: 12,
    marginBottom: 4,
  },
  stack: {
    marginBottom: 10,
  },
  fieldBlock: {
    marginBottom: 12,
  },
  fieldHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
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
  qrBlock: {
    alignItems: "center",
  },
  qrImage: {
    width: 64,
    height: 64,
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
  termsRow: {
    flexDirection: "row",
    marginBottom: 6,
  },
  termsDate: {
    width: 120,
    marginRight: 16,
  },
});

type LinesProps = {
  lines?: number;
  tight?: boolean;
};

function Lines({ lines = 1, tight }: LinesProps) {
  return (
    <View style={styles.stack}>
      {Array.from({ length: lines }).map((_, index) => (
        <View key={`line-${index}`} style={tight ? styles.lineTight : styles.line} />
      ))}
    </View>
  );
}

function StakeholderMap({
  axisPower,
  axisInterest,
  quadrants,
}: {
  axisPower: string;
  axisInterest: string;
  quadrants: ProjectCreatePdfStrings["stakeholdersMap"]["quadrants"];
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

function FieldBlock({
  title,
  question,
  lines,
  tight,
  qrCode,
  slug,
  breakBefore,
}: {
  title: string;
  question: string;
  lines?: number;
  tight?: boolean;
  qrCode?: string;
  slug: string;
  breakBefore?: boolean;
}) {
  return (
    <View style={styles.fieldBlock} wrap={false} break={breakBefore}>
      <View style={styles.fieldHeader}>
        <View style={styles.column}>
          <Text style={styles.label}>{title}</Text>
          <Text style={styles.question}>{question}</Text>
        </View>
        {qrCode ? (
          <View style={styles.qrBlock}>
            <Image src={qrCode} style={styles.qrImage} />
          </View>
        ) : null}
      </View>
      <Lines lines={lines} tight={tight} />
    </View>
  );
}

type ProjectCreatePdfDocumentProps = {
  strings: ProjectCreatePdfStrings;
  aspects: Record<string, ManifestAspect>;
  qrCodes: Record<string, string>;
};

export function ProjectCreatePdfDocument({
  strings,
  aspects,
  qrCodes,
}: ProjectCreatePdfDocumentProps) {
  const getAspect = (slug: string) => aspects[slug];
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.footer} fixed>
          <View style={styles.footerRow}>
            <View style={styles.footerDot} />
            <Text style={styles.footerText}>Powered by IPMS</Text>
          </View>
        </View>
        <View style={styles.header}>
          <Text style={styles.kicker}>{strings.kicker}</Text>
          <Text style={styles.title}>{strings.title}</Text>
          <Text style={styles.description}>{strings.description}</Text>
          <Text style={styles.subtitle}>{strings.subtitle}</Text>
          <View style={styles.divider} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{strings.sections.basics}</Text>
          <FieldBlock
            title={getAspect("name").title}
            question={getAspect("name").question}
            qrCode={qrCodes["name"]}
            slug="name"
          />
          <FieldBlock
            title={getAspect("category").title}
            question={getAspect("category").question}
            qrCode={qrCodes["category"]}
            slug="category"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{strings.sections.vision}</Text>
          <FieldBlock
            title={getAspect("goal").title}
            question={getAspect("goal").question}
            qrCode={qrCodes["goal"]}
            slug="goal"
          />
          <FieldBlock
            title={getAspect("outcome").title}
            question={getAspect("outcome").question}
            qrCode={qrCodes["outcome"]}
            slug="outcome"
          />
          <View style={styles.fieldBlock} wrap={false} break>
            <View style={styles.fieldHeader}>
              <View style={styles.column}>
                <Text style={styles.label}>{getAspect("stakeholders").title}</Text>
                <Text style={styles.question}>{getAspect("stakeholders").question}</Text>
              </View>
              {qrCodes["stakeholders"] ? (
                <View style={styles.qrBlock}>
                  <Image src={qrCodes["stakeholders"]} style={styles.qrImage} />
                </View>
              ) : null}
            </View>
            <StakeholderMap
              axisPower={strings.stakeholdersMap.axisPower}
              axisInterest={strings.stakeholdersMap.axisInterest}
              quadrants={strings.stakeholdersMap.quadrants}
            />
          </View>
          <FieldBlock
            title={getAspect("justification").title}
            question={getAspect("justification").question}
            qrCode={qrCodes["justification"]}
            slug="justification"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{strings.sections.direction}</Text>
          <FieldBlock
            title={getAspect("mvp").title}
            question={getAspect("mvp").question}
            lines={4}
            tight
            qrCode={qrCodes["mvp"]}
            slug="mvp"
          />
          <FieldBlock
            title={getAspect("scope-in").title}
            question={getAspect("scope-in").question}
            lines={4}
            tight
            qrCode={qrCodes["scope-in"]}
            slug="scope-in"
          />
          <FieldBlock
            title={getAspect("scope-out").title}
            question={getAspect("scope-out").question}
            lines={4}
            tight
            qrCode={qrCodes["scope-out"]}
            slug="scope-out"
            breakBefore
          />
          <FieldBlock
            title={getAspect("kpi").title}
            question={getAspect("kpi").question}
            lines={4}
            tight
            qrCode={qrCodes["kpi"]}
            slug="kpi"
          />
          <FieldBlock
            title={getAspect("milestones").title}
            question={getAspect("milestones").question}
            lines={4}
            tight
            qrCode={qrCodes["milestones"]}
            slug="milestones"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{strings.sections.resources}</Text>
          <FieldBlock
            title={getAspect("people").title}
            question={getAspect("people").question}
            qrCode={qrCodes["people"]}
            slug="people"
          />
          <FieldBlock
            title={getAspect("budget").title}
            question={getAspect("budget").question}
            qrCode={qrCodes["budget"]}
            slug="budget"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{strings.sections.wrapup}</Text>
          <FieldBlock
            title={getAspect("chances").title}
            question={getAspect("chances").question}
            lines={4}
            tight
            qrCode={qrCodes["chances"]}
            slug="chances"
            breakBefore
          />
          <FieldBlock
            title={getAspect("threats").title}
            question={getAspect("threats").question}
            lines={4}
            tight
            qrCode={qrCodes["threats"]}
            slug="threats"
          />
          <View style={styles.stack}>
            <View style={styles.fieldHeader}>
              <View style={styles.column}>
                <Text style={styles.label}>{getAspect("terms").title}</Text>
                <Text style={styles.question}>{getAspect("terms").question}</Text>
              </View>
              {qrCodes["terms"] ? (
                <View style={styles.qrBlock}>
                  <Image src={qrCodes["terms"]} style={styles.qrImage} />
                </View>
              ) : null}
            </View>
            {Array.from({ length: 4 }).map((_, index) => (
              <View key={`terms-${index}`} style={styles.termsRow}>
                <View style={[styles.lineTight, styles.termsDate]} />
                <View style={[styles.lineTight, styles.column]} />
              </View>
            ))}
          </View>
        </View>
      </Page>
    </Document>
  );
}
