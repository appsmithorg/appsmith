import { test, expect } from "../../../fixtures";
import { loadMigrationState } from "../../../helpers/migration-state";
import { TableComponent } from "../../../page-objects/components/table.component";
import { DeployPage } from "../../../page-objects/deploy.page";

test.describe("Migration v1.9.24 — MongoDB CRUD", () => {
  let appSlug: string;

  test.beforeAll(() => {
    const state = loadMigrationState();
    appSlug = state.appSlug;
  });

  test("table renders with listingAndReviews data", async ({ page }) => {
    await page.goto(`/app/${appSlug}/listingandreviews-*`);
    await page.waitForLoadState("networkidle");

    await expect(page.locator(".t--widget-textwidget").first()).toContainText(
      "listingAndReviews Data",
    );

    const table = new TableComponent(page, "data_table");
    await table.waitUntilLoaded();
    await expect(table.rows).not.toHaveCount(0);
  });

  test("filter by _id returns correct amenities", async ({ page }) => {
    await page.goto(`/app/${appSlug}/listingandreviews-*`);
    await page.waitForLoadState("networkidle");

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
