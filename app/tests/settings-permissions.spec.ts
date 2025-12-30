import { test, expect, Page } from "@playwright/test";

type PermissionOption = { value: string; label: string };
type UserRow = {
  id: string;
  name: string;
  email: string;
  permissions: string[];
  createdAt: string;
};

const allPermissions: PermissionOption[] = [
  { value: "CREATE_USERS", label: "Create users" },
  { value: "REMOVE_USERS", label: "Remove users" },
  { value: "UPDATE_USERS", label: "Update users" },
  { value: "CREATE_ALL_PROJECTS", label: "Create projects" },
  { value: "REMOVE_ALL_PROJECTS", label: "Remove projects" },
  { value: "UPDATE_ALL_PROJECTS", label: "Update projects" },
];

async function mockSession(page: Page, userId = "u-1") {
  await page.route("**/api/auth/get-session", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        session: {
          id: "s-1",
          userId,
          token: "token",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
        },
        user: {
          id: userId,
          email: "admin@example.com",
          name: "Admin User",
          emailVerified: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      }),
    });
  });
}

async function mockSettings(page: Page, permissions: string[]) {
  await page.route("**/api/settings", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        user: {
          id: "u-1",
          email: "admin@example.com",
          name: "Admin User",
          bio: "",
          permissions,
          socialLinks: [],
        },
      }),
    });
  });
}

async function mockUsers(page: Page, users: UserRow[]) {
  await page.route("**/api/users", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ users }),
    });
  });
}

async function mockPermissions(page: Page) {
  await page.route("**/api/permissions", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ permissions: allPermissions }),
    });
  });
}

test("no permissions hides All accounts tab and redirects", async ({ page }) => {
  await mockSession(page);
  await mockSettings(page, []);
  await mockUsers(page, []);
  await mockPermissions(page);

  await page.goto("/settings/users");
  await page.waitForURL("**/settings/account");
  await expect(page.locator("text=All accounts")).toHaveCount(0);
});

test("create users only shows invite and disables edit/delete", async ({ page }) => {
  await mockSession(page);
  await mockSettings(page, ["CREATE_USERS"]);
  await mockPermissions(page);
  await mockUsers(page, [
    {
      id: "u-1",
      name: "Admin User",
      email: "admin@example.com",
      permissions: ["CREATE_USERS"],
      createdAt: new Date().toISOString(),
    },
  ]);

  await page.goto("/settings/users");
  await expect(page.getByText("Zaproszenia")).toBeVisible();
  await expect(page.getByLabel("Imie i nazwisko")).toBeVisible();
  await expect(page.getByRole("button", { name: "Zmien" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Usun" })).toBeDisabled();
});

test("update/remove permissions show editor dropdown and limited chips", async ({ page }) => {
  await mockSession(page);
  await mockSettings(page, ["UPDATE_USERS", "REMOVE_USERS", "CREATE_USERS"]);
  await mockPermissions(page);
  await mockUsers(page, [
    {
      id: "u-1",
      name: "Admin User",
      email: "admin@example.com",
      permissions: ["CREATE_USERS", "UPDATE_USERS", "REMOVE_USERS", "CREATE_ALL_PROJECTS"],
      createdAt: new Date().toISOString(),
    },
    {
      id: "u-2",
      name: "Dev User",
      email: "dev@example.com",
      permissions: ["UPDATE_USERS"],
      createdAt: new Date().toISOString(),
    },
  ]);

  await page.goto("/settings/users");
  await expect(page.getByText("+2")).toBeVisible();
  await expect(page.locator("text=ID:")).toHaveCount(0);

  const editButtons = page.getByRole("button", { name: "Zmien" });
  await expect(editButtons.first()).toBeEnabled();
  await editButtons.first().click();

  await page.getByRole("button", { name: /wybierz uprawnienia|wybrane/i }).click();
  await expect(page.getByPlaceholder("Szukaj uprawnien...")).toBeVisible();
  await page.getByPlaceholder("Szukaj uprawnien...").fill("Remove");
  await expect(page.getByText("Remove users")).toBeVisible();
});
