#!/usr/bin/env node

let dotenvLoaded = false;
try {
  // Load environment variables from .env when available.
  require("dotenv").config({ path: ".env" });
  dotenvLoaded = true;
} catch (error) {
  if (error.code !== "MODULE_NOT_FOUND") {
    throw error;
  }
}

const { betterAuth } = require("better-auth");
const { prismaAdapter } = require("better-auth/adapters/prisma");
// Use the generated client directly to avoid workspace module resolution issues.
const {
  PrismaClient,
  GlobalPermission,
  ProjectPermission,
  ProjectRole,
} = require("../node_modules/@prisma/client/.prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

const requiredEnv = [
  "DATABASE_URL",
  "BETTER_AUTH_URL",
  "BETTER_AUTH_SECRET",
  "ADMIN_EMAIL",
  "ADMIN_PASSWORD",
];

const missing = requiredEnv.filter((key) => !process.env[key]);
if (missing.length > 0) {
  const envHint = dotenvLoaded ? "" : " (dotEnv not loaded; set env or install dotenv)";
  console.error(`Missing required environment variables${envHint}: ${missing.join(", ")}`);
  process.exit(1);
}

const adminEmail = process.env.ADMIN_EMAIL;
const adminPassword = process.env.ADMIN_PASSWORD;
const adminName = process.env.ADMIN_NAME || "Admin User";

if (adminPassword.length < 8) {
  console.error("ADMIN_PASSWORD must be at least 8 characters long.");
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const auth = betterAuth({
  appName: "IPMS",
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: { enabled: true },
  socialProviders: {},
});

const allPermissions = Object.values(GlobalPermission);
const allProjectPermissions = Object.values(ProjectPermission);
const projectName = "Tworzenie strony dla sklepu zoologicznego";
const projectTradeName = "PetStore Online";
const projectCategory = "E-commerce";
const projectGoal = "Nowoczesna strona sprzedażowa dla sklepu zoologicznego z prostym checkoutem.";
const projectJustification =
  "Sklep potrzebuje nowego kanału sprzedaży online, lepszej prezentacji oferty i poprawy konwersji.";
const projectDescription =
  "Projekt obejmuje zaprojektowanie i wdrożenie strony sklepu zoologicznego z katalogiem produktów, koszykiem, płatnościami i panelem administracyjnym.";
const projectStakeholders =
  "Właściciel sklepu, klienci detaliczni, dostawcy produktów, zespół obsługi klienta.";
const projectInScope = [
  "Strona główna i landing z promocjami",
  "Katalog produktów i filtrowanie",
  "Koszyk i checkout",
  "Panel admina do zarządzania produktami",
];
const projectOutScope = ["Aplikacja mobilna", "Integracje marketplace"];
const projectMilestones = [
  "Warsztat wymagań",
  "Makiety i UI",
  "MVP sklepu",
  "Wdrożenie produkcyjne",
];
const projectKpis = ["Wzrost konwersji do 2.5%", "Min. 30 zamówień tygodniowo"];
const projectMvp = ["Katalog", "Koszyk", "Checkout", "Panel admina"];
const projectChances = ["Rozszerzenie bazy klientów", "Lepsza widoczność w sieci"];
const projectThreats = ["Ograniczony budżet marketingowy", "Silna konkurencja online"];
const projectTerms = [
  { date: "2026-02-15", description: "Start prac UX i analiza wymagań." },
  { date: "2026-03-20", description: "Oddanie MVP sklepu." },
  { date: "2026-04-30", description: "Wdrożenie produkcyjne." },
];
const projectStakeholderEntries = [
  { name: "Właściciel sklepu", role: "Sponsor", notes: "Decyzje biznesowe i budżet." },
  { name: "Obsługa klienta", role: "Użytkownik", notes: "Procesy zwrotów i wsparcia." },
  { name: "Klienci", role: "Użytkownik", notes: "Doświadczenie zakupowe." },
];
const projectPeopleHighAvailability = 3;
const projectPeopleLowAvailability = 1;
const projectBudget = 65000;
const projectTokens = 12000;

async function main() {
  const existing = await prisma.user.findUnique({
    where: { email: adminEmail },
    select: { id: true },
  });

  if (!existing) {
    console.log(`Creating admin user ${adminEmail}...`);
    await auth.api.signUpEmail({
      body: {
        name: adminName,
        email: adminEmail,
        password: adminPassword,
      },
    });
  } else {
    console.log(`User ${adminEmail} already exists, updating permissions...`);
  }

  const user = await prisma.user.update({
    where: { email: adminEmail },
    data: {
      name: adminName,
      emailVerified: true,
      permissions: { set: allPermissions },
    },
    select: {
      id: true,
      name: true,
      email: true,
      permissions: true,
      createdAt: true,
    },
  });

  const existingProject = await prisma.project.findFirst({
    where: { name: projectName },
    select: { id: true },
  });

  if (!existingProject) {
    console.log(`Creating project "${projectName}"...`);
    await prisma.project.create({
      data: {
        name: projectName,
        tradeName: projectTradeName,
        category: projectCategory,
        goal: projectGoal,
        justification: projectJustification,
        description: projectDescription,
        stakeholders: projectStakeholders,
        isDraft: false,
        tokens: projectTokens,
        inScope: projectInScope,
        outScope: projectOutScope,
        milestones: projectMilestones,
        kpis: projectKpis,
        mvp: projectMvp,
        chances: projectChances,
        threats: projectThreats,
        terms: projectTerms,
        stakeholderEntries: projectStakeholderEntries,
        peopleHighAvailability: projectPeopleHighAvailability,
        peopleLowAvailability: projectPeopleLowAvailability,
        budget: projectBudget,
        members: {
          create: {
            userId: user.id,
            role: ProjectRole.OWNER,
            permissions: allProjectPermissions,
          },
        },
      },
      select: { id: true },
    });
  } else {
    const existingMember = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: existingProject.id, userId: user.id } },
      select: { id: true },
    });

    if (!existingMember) {
      console.log(`Adding admin to project "${projectName}"...`);
      await prisma.projectMember.create({
        data: {
          projectId: existingProject.id,
          userId: user.id,
          role: ProjectRole.OWNER,
          permissions: allProjectPermissions,
        },
      });
    }
  }

  console.log("Admin user ready:", user);
}

main()
  .catch((error) => {
    console.error("Failed to create admin user:", error?.message ?? error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
