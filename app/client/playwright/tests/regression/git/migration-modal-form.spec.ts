import { test, expect } from "../../../fixtures";
import { loadMigrationState } from "../../../helpers/migration-state";
import { API } from "../../../constants/api-routes";
import { SELECTORS } from "../../../constants/selectors";
import { DeployPage } from "../../../page-objects/deploy.page";

test.describe("Migration v1.9.24 — Modal & JSON Form (Widgets page)", () => {
  let appSlug: string;

  test.beforeAll(() => {
    const state = loadMigrationState();
    appSlug = state.appSlug;
  });

  test.beforeEach(async ({ page }) => {
    await page.goto(`/app/${appSlug}/widgets-*`);
    await expect(
      page.getByRole("button", { name: "Add customer Details" }),
    ).toBeVisible();
  });

  test("add customer via modal form, then delete", async ({ page }) => {
    const deploy = new DeployPage(page);

    await page.getByRole("button", { name: "Add customer Details" }).click();
    await expect(page.locator(SELECTORS.modal)).toBeVisible();

    await deploy.fillJsonInput("Customer Name", "TestUser");
    await deploy.fillJsonInput("Customer Number", "1");
    await deploy.fillJsonInput("Phone Number", "999999999");

    const addResponse = page.waitForResponse(
      (r) => r.url().includes(API.actionsExecute) && r.ok(),
    );
    await page.getByRole("button", { name: "Submit" }).nth(1).click();
    await addResponse;

    await expect(page.locator(SELECTORS.toast)).toContainText(
      "Add Customer Successful!",
    );

    await page.getByRole("button", { name: "Close" }).click();
    await expect(page.locator(SELECTORS.modal)).not.toBeVisible();

    await page.getByRole("button", { name: "Delete customer details" }).click();
    await expect(page.locator(SELECTORS.modal)).toBeVisible();

    const deleteResponse = page.waitForResponse(
      (r) => r.url().includes(API.actionsExecute) && r.ok(),
    );
    await page.getByRole("button", { name: "Confirm" }).click();
    await deleteResponse;

    await expect(page.locator(SELECTORS.toast)).toContainText(
      "Delete customer successful!",
    );

    await page.getByRole("button", { name: "Close" }).click();
    await expect(page.locator(SELECTORS.modal)).not.toBeVisible();
  });
});
