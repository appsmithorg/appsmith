import { test as setup, expect } from "@playwright/test";
import { ROUTES } from "../constants/routes";

const authFile = "playwright/auth/user.json";

setup("authenticate", async ({ page }) => {
  const username = process.env.USERNAME;
  const password = process.env.PASSWORD;

  if (!username || !password) {
    throw new Error(
      "USERNAME and PASSWORD environment variables are required for auth setup",
    );
  }

  await page.goto(ROUTES.login);
  await page.getByPlaceholder("Enter your email").fill(username);
  await page.getByPlaceholder("Enter your password").fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();

  await page.waitForURL((url) => !url.pathname.includes("/login"));
  await expect(page).not.toHaveURL(/\/login/);

  await page.context().storageState({ path: authFile });
});
