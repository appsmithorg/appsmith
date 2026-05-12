import { test, expect } from "../../../fixtures";
import { loadMigrationState, getPage } from "../../../helpers/migration-state";
import type { MigrationPage } from "../../../fixtures/migration.setup";
import { viewUrl } from "../../../helpers/url";
import { API } from "../../../constants/api-routes";
import { SELECTORS } from "../../../constants/selectors";
import { TableComponent } from "../../../page-objects/components/table.component";
import { DeployPage } from "../../../page-objects/deploy.page";

test.describe("Migration v1.9.24 — PostgreSQL CRUD (astronauts)", () => {
  let appSlug: string;
  let branchName: string;
  let astronautsPage: MigrationPage;

  test.beforeAll(() => {
    const state = loadMigrationState();
    appSlug = state.appSlug;
    branchName = state.branchName;
    astronautsPage = getPage(state, "public-astronauts");
  });

  test("table renders with astronauts data", async ({ page }) => {
    await page.goto(
      viewUrl({
        pageId: astronautsPage.baseId,
        pageSlug: astronautsPage.slug,
        appSlug,
        branch: branchName,
      }),
    );

    const heading = page
      .locator(SELECTORS.widgetInDeployed("textwidget"))
      .first();
    await expect(heading).toContainText("public_astronauts Data");

    const table = new TableComponent(page, "data_table");
    await table.waitUntilLoaded();
    await expect(table.rows).not.toHaveCount(0);
  });

  test("filter by id=196 returns Ulf Merbold", async ({ page }) => {
    await page.goto(
      viewUrl({
        pageId: astronautsPage.baseId,
        pageSlug: astronautsPage.slug,
        appSlug,
        branch: branchName,
      }),
    );

    const table = new TableComponent(page, "data_table");
    await table.waitUntilLoaded();
    await table.filter("id", "is exactly", "196");

    await expect(table.cell(0, 2)).toContainText("Ulf Merbold");
    await table.removeFilter();
  });

  test("update astronaut status via JSON form", async ({ page }) => {
    await page.goto(
      viewUrl({
        pageId: astronautsPage.baseId,
        pageSlug: astronautsPage.slug,
        appSlug,
        branch: branchName,
      }),
    );

    const deploy = new DeployPage(page);
    const table = new TableComponent(page, "data_table");
    await table.waitUntilLoaded();

    await deploy.fillJsonInput("Statusid", "5");
    await deploy.fillJsonInput("Statusname", "Active");

    const updateResponse = page.waitForResponse(
      (r) => r.url().includes(API.actionsExecute) && r.ok(),
    );
    await page.locator(SELECTORS.jsonFormSubmitBtn).click({ force: true });
    await updateResponse;

    await table.waitUntilLoaded();
    await expect(table.cell(0, 3)).toContainText("5");
    await expect(table.cell(0, 4)).toContainText("Active");
  });
});
