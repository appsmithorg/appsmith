import { expect as baseExpect, type Page } from "@playwright/test";
import { SELECTORS } from "../constants/selectors";

export const expect = baseExpect.extend({
  async toShowToast(page: Page, message: string) {
    const assertionName = "toShowToast";
    const toast = page.locator(SELECTORS.toast);

    try {
      await baseExpect(toast).toContainText(message, { timeout: 5_000 });
      return {
        pass: true,
        name: assertionName,
        message: () => `Toast "${message}" appeared as expected`,
      };
    } catch {
      return {
        pass: false,
        name: assertionName,
        message: () =>
          `Expected toast with message "${message}" but it did not appear within 5s`,
      };
    }
  },

  async toHaveToastDisappeared(page: Page, message: string) {
    const assertionName = "toHaveToastDisappeared";
    const toast = page.locator(SELECTORS.toast).filter({ hasText: message });

    try {
      await baseExpect(toast).toBeHidden({ timeout: 10_000 });
      return {
        pass: true,
        name: assertionName,
        message: () => `Toast "${message}" disappeared as expected`,
      };
    } catch {
      return {
        pass: false,
        name: assertionName,
        message: () =>
          `Expected toast "${message}" to disappear but it is still visible after 10s`,
      };
    }
  },
});
