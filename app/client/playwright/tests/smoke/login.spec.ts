import { test, expect } from "@playwright/test";
import { ROUTES } from "../../constants/routes";

test.describe("Smoke — Login", { tag: ["@smoke"] }, () => {
  test("authenticated user lands on applications page", async ({ page }) => {
    await page.goto(ROUTES.applications);
    await expect(page).toHaveURL(/\/applications/);
    await expect(page.getByRole("button", { name: /new/i })).toBeVisible();
  });
});
