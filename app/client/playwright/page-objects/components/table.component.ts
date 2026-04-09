import type { Page, Locator } from "@playwright/test";
import { SELECTORS } from "../../constants/selectors";

export class TableComponent {
  readonly page: Page;
  readonly container: Locator;

  constructor(page: Page, name = "data_table") {
    this.page = page;
    this.container = page.locator(SELECTORS.widgetByName(name));
  }

  get rows(): Locator {
    return this.container.locator("tbody tr");
  }

  cell(row: number, col: number): Locator {
    return this.rows.nth(row).locator("td").nth(col);
  }

  async waitUntilLoaded() {
    await this.container.waitFor({ state: "visible" });
    await this.rows.first().waitFor({ state: "visible" });
  }

  async filter(column: string, condition: string, value: string) {
    await this.container.getByRole("button", { name: /filter/i }).click();

    const filterPanel = this.page.locator(".t--filter-panel");
    await filterPanel.getByTestId("t--table-filter-columns-dropdown").click();
    await this.page.getByText(column, { exact: true }).click();

    await filterPanel
      .getByTestId("t--table-filter-conditions-dropdown")
      .click();
    await this.page.getByText(condition, { exact: false }).click();

    await filterPanel.locator(".t--table-filter-value-input input").fill(value);

    await filterPanel.getByRole("button", { name: /apply/i }).click();

    await this.waitUntilLoaded();
  }

  async removeFilter() {
    await this.page
      .locator(".t--filter-panel")
      .getByRole("button", { name: /remove/i })
      .click();
    await this.waitUntilLoaded();
  }

  async closeFilter() {
    await this.page
      .locator(".t--filter-panel")
      .getByRole("button", { name: /close/i })
      .click();
  }

  async downloadAs(format: string): Promise<string> {
    const downloadPromise = this.page.waitForEvent("download");
    await this.container.getByRole("button", { name: /download/i }).click();
    await this.page
      .getByRole("menuitem", { name: new RegExp(format, "i") })
      .click();
    const download = await downloadPromise;
    return download.suggestedFilename();
  }
}
