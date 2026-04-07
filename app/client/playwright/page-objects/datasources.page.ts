import type { Page } from "@playwright/test";
import { API } from "../constants/api-routes";

type DatasourceType = "MongoDB" | "MySQL" | "PostgreSQL";

export class DatasourcesPage {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async reconnectByType(type: DatasourceType) {
    const reconnectButton = this.page
      .getByText(type)
      .locator("..")
      .getByRole("button", { name: /reconnect/i });

    const responsePromise = this.page.waitForResponse(
      (r) => r.url().includes(API.datasources) && r.ok(),
    );
    await reconnectButton.click();
    await responsePromise;
  }
}
