import { test, expect } from "@playwright/test";
import { mockSession } from "./helpers";

test("settings account renders tags from profile data", async ({ page }) => {
  await mockSession(page, {
    id: "u-1",
    email: "admin@example.com",
    name: "Admin User",
  });

  await page.route("**/api/settings", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        user: {
          id: "u-1",
          email: "admin@example.com",
          name: "Admin User",
          bio: "Opis profilu",
          image: null,
          permissions: ["UPLOAD_PHOTOS"],
          hobbies: ["bieganie", "fotografia"],
          strengths: ["analityka"],
          weaknesses: ["multitasking"],
          career: [],
          socialLinks: [],
        },
      }),
    });
  });

  await page.goto("/settings/account");

  await expect(page.getByText("bieganie")).toBeVisible();
  await expect(page.getByText("fotografia")).toBeVisible();
  await expect(page.getByText("analityka")).toBeVisible();
  await expect(page.getByText("multitasking")).toBeVisible();
});

test("settings account saves tags and career entries", async ({ page }) => {
  await mockSession(page, {
    id: "u-1",
    email: "admin@example.com",
    name: "Admin User",
  });

  let received: Record<string, unknown> | null = null;
  await page.route("**/api/settings", async (route) => {
    if (route.request().method() === "PUT") {
      received = route.request().postDataJSON() as Record<string, unknown>;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ user: received }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        user: {
          id: "u-1",
          email: "admin@example.com",
          name: "Admin User",
          bio: "",
          image: null,
          permissions: ["UPLOAD_PHOTOS"],
          hobbies: [],
          strengths: [],
          weaknesses: [],
          career: [],
          socialLinks: [],
        },
      }),
    });
  });

  await page.goto("/settings/account");

  await page.getByLabel("Hobby").fill("bieganie");
  await page.keyboard.press("Enter");
  await page.getByLabel("Mocne strony").fill("analityka");
  await page.keyboard.press("Enter");
  await page.getByLabel("Slabe strony").fill("multitasking");
  await page.keyboard.press("Enter");

  await page.getByRole("button", { name: "Dodaj wpis" }).click();
  await page.locator('input[type="date"]').fill("2022-01-01");
  await page.getByPlaceholder("np. Senior Frontend").fill("Senior Frontend");
  await page.getByPlaceholder("np. Acme").fill("Acme");
  await page.getByPlaceholder("np. 2 lata").fill("2 lata");

  await page.getByRole("button", { name: "Zapisz zmiany" }).click();

  expect(received).not.toBeNull();
  expect(received?.hobbies).toEqual(["bieganie"]);
  expect(received?.strengths).toEqual(["analityka"]);
  expect(received?.weaknesses).toEqual(["multitasking"]);
  expect(received?.career).toEqual([
    {
      startDate: "2022-01-01",
      position: "Senior Frontend",
      companyName: "Acme",
      duration: "2 lata",
    },
  ]);
});

test("profile photo upload respects permissions", async ({ page }) => {
  await mockSession(page, {
    id: "u-1",
    email: "admin@example.com",
    name: "Admin User",
  });

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
          image: null,
          permissions: [],
          hobbies: [],
          strengths: [],
          weaknesses: [],
          career: [],
          socialLinks: [],
        },
      }),
    });
  });

  await page.goto("/settings/account");
  await expect(page.locator('input[type="file"]')).toBeDisabled();
});

test("profile photo upload updates avatar when allowed", async ({ page }) => {
  await mockSession(page, {
    id: "u-1",
    email: "admin@example.com",
    name: "Admin User",
  });

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
          image: null,
          permissions: ["UPLOAD_PHOTOS"],
          hobbies: [],
          strengths: [],
          weaknesses: [],
          career: [],
          socialLinks: [],
        },
      }),
    });
  });

  let uploadCalled = false;
  await page.route("**/api/photos", async (route) => {
    uploadCalled = true;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=",
      }),
    });
  });

  await page.goto("/settings/account");
  const fileInput = page.locator('input[type="file"]');
  await expect(fileInput).toBeEnabled();
  const uploadRequest = page.waitForRequest("**/api/photos");
  await fileInput.setInputFiles({
    name: "avatar.png",
    mimeType: "image/png",
    buffer: Buffer.from([137, 80, 78, 71]),
  });
  await uploadRequest;

  await expect.poll(() => uploadCalled).toBe(true);
  await expect(page.locator('img[alt="Profile image"]')).toHaveAttribute(
    "src",
    /data:image\/png/,
  );
});
