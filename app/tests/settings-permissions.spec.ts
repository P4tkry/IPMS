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
  { value: "UPLOAD_PHOTOS", label: "Upload photos" },
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


test("editing a user sends updated permissions", async ({ page }) => {
  await mockSession(page);
  await mockSettings(page, ["UPDATE_USERS"]);
  await mockPermissions(page);
  await mockUsers(page, [
    {
      id: "u-1",
      name: "Admin User",
      email: "admin@example.com",
      permissions: ["UPDATE_USERS"],
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

  let received: { name?: string; permissions?: string[] } | null = null;

  await page.route("**/api/users/**", async (route) => {
    if (route.request().method() !== "PUT") {
      await route.fallback();
      return;
    }

    received = route.request().postDataJSON() as { name?: string; permissions?: string[] };
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        user: {
          id: "u-2",
          name: "Dev User",
          email: "dev@example.com",
          permissions: received?.permissions ? [],
          createdAt: new Date().toISOString(),
        },
      }),
    });
  });

  await page.goto("/settings/users");

  const editButtons = page.getByRole("button", { name: "Zmien" });
  await expect(editButtons.nth(1)).toBeEnabled();
  await editButtons.nth(1).click();

  await page.getByRole("button", { name: /wybierz uprawnienia|wybrane/i }).click();
  await page.getByRole("button", { name: "Upload photos" }).click();
  await page.getByText("Lista uzytkownikow").click();

  const requestPromise = page.waitForRequest(
    (request) => request.url().includes("/api/users/") && request.method() === "PUT",
  );
  await page.getByRole("button", { name: "Zapisz" }).click();

  const request = await requestPromise;
  const payload = request.postDataJSON() as { name?: string; permissions?: string[] };
  expect(payload?.permissions).toContain("UPLOAD_PHOTOS");
});

test("invite generation sends payload and shows link", async ({ page }) => {
  await mockSession(page);
  await mockSettings(page, ["CREATE_USERS"]);
  await mockPermissions(page);
  await mockUsers(page, []);

  let invitePayload: { name?: string; email?: string } | null = null;
  await page.route("**/api/invites", async (route) => {
    if (route.request().method() !== "POST") {
      await route.fallback();
      return;
    }
    invitePayload = route.request().postDataJSON() as { name?: string; email?: string };
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ link: "http://localhost:3000/register?token=abc" }),
    });
  });

  await page.goto("/settings/users");
  await page.getByLabel("Imie i nazwisko").fill("New User");
  await page.getByLabel("Email").fill("new@example.com");
  await page.getByRole("button", { name: "Generuj link" }).click();

  await expect(page.getByText("Wygenerowano link zaproszenia.")).toBeVisible();
  await expect(page.getByText("http://localhost:3000/register?token=abc")).toBeVisible();
  expect(invitePayload).toEqual({ name: "New User", email: "new@example.com" });
});

test("remove user flow deletes account", async ({ page }) => {
  await mockSession(page);
  await mockSettings(page, ["REMOVE_USERS"]);
  await mockPermissions(page);
  await mockUsers(page, [
    {
      id: "u-1",
      name: "Admin User",
      email: "admin@example.com",
      permissions: ["REMOVE_USERS"],
      createdAt: new Date().toISOString(),
    },
    {
      id: "u-2",
      name: "Dev User",
      email: "dev@example.com",
      permissions: [],
      createdAt: new Date().toISOString(),
    },
  ]);

  await page.route("**/api/users/u-2", async (route) => {
    if (route.request().method() !== "DELETE") {
      await route.fallback();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ status: "ok" }),
    });
  });

  await page.goto("/settings/users");
  await page.getByRole("button", { name: "Usun" }).nth(1).click();
  await page.getByRole("button", { name: "Potwierdz usuniecie" }).click();

  await expect(page.getByText("dev@example.com")).toHaveCount(0);
});
