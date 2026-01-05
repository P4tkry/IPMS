import { test, expect } from "@playwright/test";

test("register shows error without token", async ({ page }) => {
  await page.goto("/register");

  await expect(page.getByText("Brak tokenu zaproszenia.")).toBeVisible();
});

test("register handles invalid invite token", async ({ page }) => {
  await page.route("**/api/invites**", async (route) => {
    await route.fulfill({
      status: 404,
      contentType: "application/json",
      body: JSON.stringify({ message: "Invite not found." }),
    });
  });

  await page.goto("/register?token=invalid");

  await expect(page.getByText("Invite not found.")).toBeVisible();
});

test("register completes with valid invite", async ({ page }) => {
  await page.route("**/api/invites**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        invite: { name: "Patryk Rusak", email: "patryk@example.com" },
      }),
    });
  });

  let registerPayload: { token?: string; password?: string } | null = null;
  await page.route("**/api/register", async (route) => {
    registerPayload = route.request().postDataJSON() as {
      token?: string;
      password?: string;
    };
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({ status: "ok" }),
    });
  });

  await page.goto("/register?token=invite-token");
  await page.getByLabel("Haslo", { exact: true }).fill("password123");
  await page.getByLabel("Potwierdz haslo").fill("password123");
  await page.getByRole("button", { name: "Utworz konto" }).click();

  await page.waitForURL("**/login");
  expect(registerPayload).toEqual({ token: "invite-token", password: "password123" });
});
