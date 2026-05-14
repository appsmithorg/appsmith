import { test, expect } from "../../../fixtures";
import { loadMigrationState, getPage } from "../../../helpers/migration-state";
import type { MigrationPage } from "../../../fixtures/migration.setup";
import { viewUrl } from "../../../helpers/url";
import { SELECTORS } from "../../../constants/selectors";
import { TableComponent } from "../../../page-objects/components/table.component";

test.describe("Migration v1.9.24 — MongoDB CRUD", () => {
  let appSlug: string;
  let branchName: string;
  let listingPage: MigrationPage;

  test.beforeAll(() => {
    const state = loadMigrationState();
    appSlug = state.appSlug;
    branchName = state.branchName;
    listingPage = getPage(state, "listingandreviews");
  });

  test("table renders with listingAndReviews data", async ({ page }) => {
    await page.goto(
      viewUrl({
        pageId: listingPage.baseId,
        pageSlug: listingPage.slug,
        appSlug,
        branch: branchName,
      }),
    );

    const heading = page
      .locator(SELECTORS.widgetInDeployed("textwidget"))
      .first();
    await expect(heading).toContainText("listingAndReviews Data");

    const table = new TableComponent(page, "data_table");
    await table.waitUntilLoaded();
    await expect(table.rows).not.toHaveCount(0);
  });

  test("filter by _id returns correct amenities", async ({ page }) => {
    await page.goto(
      viewUrl({
        pageId: listingPage.baseId,
        pageSlug: listingPage.slug,
        appSlug,
        branch: branchName,
      }),
    );

    const table = new TableComponent(page, "data_table");
    await table.waitUntilLoaded();
    await table.filter("_id", "is exactly", "15665837");

    const amenitiesCell = table.cell(0, 0);
    await expect(amenitiesCell).toContainText("TV");
    await expect(amenitiesCell).toContainText("Internet");
    await expect(amenitiesCell).toContainText("Wifi");
    await expect(amenitiesCell).toContainText("Pool");
  });
});
