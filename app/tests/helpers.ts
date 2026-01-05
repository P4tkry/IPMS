import { Page } from "@playwright/test";

type SessionUser = {
  id: string;
  email: string;
  name: string;
  emailVerified?: boolean;
};

export const buildSession = (user?: SessionUser) => {
  if (!user) {
    return { session: null, user: null };
  }

  return {
    session: {
      id: "s-1",
      userId: user.id,
      token: "token",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
    },
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      emailVerified: user.emailVerified ? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  };
};

export async function mockSession(page: Page, user?: SessionUser) {
  await page.route("**/api/auth/get-session", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(buildSession(user)),
    });
  });
}

export async function mockSignIn(page: Page, handler?: () => void, shouldFail = false) {
  await page.route("**/api/auth/**", async (route) => {
    const url = route.request().url();
    if (!url.includes("/api/auth/sign-in/")) {
      await route.fallback();
      return;
    }
    handler?.();
    if (shouldFail) {
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({
          message: "Nie udalo sie zalogowac.",
        }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ error: null }),
    });
  });
}

export async function mockSettings(
  page: Page,
  user: Partial<{
    id: string;
    email: string;
    name: string;
    image: string | null;
    bio: string | null;
    hobbies: string[];
    strengths: string[];
    weaknesses: string[];
    career: Array<{
      id: string;
      startDate: string;
      position: string;
      companyName: string;
      duration: string;
    }>;
    socialLinks: Array<{ id: string; platform: string; url: string }>;
    permissions: string[];
  }> = {},
) {
  await page.route("**/api/settings", async (route) => {
    const payload = {
      user: {
        id: "u-1",
        email: "admin@example.com",
        name: "Admin User",
        image: null,
        bio: "",
        hobbies: [],
        strengths: [],
        weaknesses: [],
        career: [],
        socialLinks: [],
        permissions: [],
        ...user,
      },
    };
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(payload),
    });
  });
}

export async function mockPermissions(page: Page) {
  const permissions = [
    { value: "CREATE_USERS", label: "Create users" },
    { value: "REMOVE_USERS", label: "Remove users" },
    { value: "UPDATE_USERS", label: "Update users" },
    { value: "UPLOAD_PHOTOS", label: "Upload photos" },
    { value: "CREATE_ALL_PROJECTS", label: "Create projects" },
    { value: "REMOVE_ALL_PROJECTS", label: "Remove projects" },
    { value: "UPDATE_ALL_PROJECTS", label: "Update projects" },
  ];
  await page.route("**/api/permissions", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ permissions }),
    });
  });
}
