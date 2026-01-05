import { test, expect } from "@playwright/test";
import { mockSession, mockSignIn } from "./helpers";

test("login redirects to dashboard when already signed in", async ({ page }) => {
  await mockSession(page, {
    id: "u-1",
    email: "admin@example.com",
    name: "Admin User",
  });

  await page.goto("/login");
  await page.waitForURL("**/dashboard");
});

test("login shows validation errors", async ({ page }) => {
  await mockSession(page);

  await page.goto("/login");
  await page.getByRole("button", { name: "Zaloguj sie" }).click();

  await expect(page.getByText("Email jest wymagany.")).toBeVisible();
  await expect(page.getByText("Haslo jest wymagane.")).toBeVisible();
});

test("login handles auth errors", async ({ page }) => {
  await mockSession(page);
  await mockSignIn(page, undefined, true);

  await page.goto("/login");
  await page.getByLabel("Email").fill("admin@example.com");
  await page.getByLabel("Haslo").fill("bad-password");
  const requestPromise = page.waitForRequest("**/api/auth/sign-in/**");
  await page.getByRole("button", { name: "Zaloguj sie" }).click();
  await requestPromise;

  await expect(page.getByText("Nie udalo sie zalogowac.")).toBeVisible();
});

test("login success navigates to dashboard", async ({ page }) => {
  let signedIn = false;

  await page.route("**/api/auth/get-session", async (route) => {
    const body = signedIn
      ? {
          session: {
            id: "s-1",
            userId: "u-1",
            token: "token",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
          },
          user: {
            id: "u-1",
            email: "admin@example.com",
            name: "Admin User",
            emailVerified: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        }
      : { session: null, user: null };

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(body),
    });
  });

  await mockSignIn(page, () => {
    signedIn = true;
  });

  await page.goto("/login");
  await page.getByLabel("Email").fill("admin@example.com");
  await page.getByLabel("Haslo").fill("password");
  await page.getByRole("button", { name: "Zaloguj sie" }).click();

  await page.waitForURL("**/dashboard");
  await expect(page.getByText("Email: admin@example.com")).toBeVisible();
});
