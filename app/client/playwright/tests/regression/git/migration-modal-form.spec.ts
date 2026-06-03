import { test, expect } from "../../../fixtures";
import { loadMigrationState, getPage } from "../../../helpers/migration-state";
import type { MigrationPage } from "../../../fixtures/migration.setup";
import { viewUrl } from "../../../helpers/url";
import { API } from "../../../constants/api-routes";
import { SELECTORS } from "../../../constants/selectors";
import { DeployPage } from "../../../page-objects/deploy.page";

test.describe("Migration v1.9.24 — Modal & JSON Form (Widgets page)", () => {
  let appSlug: string;
  let branchName: string;
  let widgetsPage: MigrationPage;

  test.beforeAll(() => {
    const state = loadMigrationState();
    appSlug = state.appSlug;
    branchName = state.branchName;
    widgetsPage = getPage(state, "widgets");
  });

  test.beforeEach(async ({ page }) => {
    await page.goto(
      viewUrl({
        pageId: widgetsPage.baseId,
        pageSlug: widgetsPage.slug,
        appSlug,
        branch: branchName,
      }),
    );
    await expect(
      page.locator(SELECTORS.widgetInDeployed("checkboxgroupwidget")),
    ).toBeVisible();
  });

  test("add customer via modal form, then delete", async ({ page }) => {
    const deploy = new DeployPage(page);

    await page
      .getByRole("button", { name: "Add customer Details" })
      .click({ force: true });
    await expect(page.locator(SELECTORS.modal)).toBeVisible();

    await deploy.fillJsonInput("Customer Name", "TestUser");
    await deploy.fillJsonInput("Customer Number", "1");
    await deploy.fillJsonInput("Phone Number", "999999999");

    const addResponse = page.waitForResponse(
      (r) => r.url().includes(API.actionsExecute) && r.ok(),
    );
    await page
      .locator(SELECTORS.modal)
      .locator(SELECTORS.jsonFormSubmitBtn)
      .click({ force: true });
    await addResponse;

    await expect(
      page
        .locator(SELECTORS.toast)
        .filter({ hasText: "Add Customer Successful!" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Close" }).click({ force: true });
    await expect(page.locator(SELECTORS.modal)).not.toBeVisible();

    await page
      .getByRole("button", { name: "Delete customer details" })
      .click({ force: true });
    await expect(page.locator(SELECTORS.modal)).toBeVisible();

    const deleteResponse = page.waitForResponse(
      (r) => r.url().includes(API.actionsExecute) && r.ok(),
    );
    await page.getByRole("button", { name: "Confirm" }).click({ force: true });
    await deleteResponse;

    await expect(
      page
        .locator(SELECTORS.toast)
        .filter({ hasText: "Delete customer successful!" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Close" }).click({ force: true });
    await expect(page.locator(SELECTORS.modal)).not.toBeVisible();
  });
});
