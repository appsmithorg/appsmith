import type { Page, Locator } from "@playwright/test";
import { SELECTORS } from "../../constants/selectors";

export class ModalComponent {
  readonly page: Page;
  readonly container: Locator;

  constructor(page: Page) {
    this.page = page;
    this.container = page.locator(SELECTORS.modal);
  }

  get closeButton(): Locator {
    return this.container.getByRole("button", { name: /close/i });
  }

  async close() {
    await this.closeButton.click();
  }

  button(name: string, nth = 0): Locator {
    return this.container.getByRole("button", { name }).nth(nth);
  }
}
