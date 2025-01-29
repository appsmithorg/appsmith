import { ObjectsRegistry } from "../../Objects/Registry";
import { sanitizeString } from "../../../../src/utils/URLUtils";
class FileTabs {
  locators = {
    container: "[data-testid='t--editor-tabs']",
    tabName: (name: string) =>
      `[data-testid='t--ide-tab-${sanitizeString(name)}']`,
    tabs: ".editor-tab",
    addItem: "[data-testid='t--ide-tabs-add-button']",
    closeTab: "[data-testid='t--tab-close-btn']",
  };

  assertVisibility() {
    ObjectsRegistry.AggregateHelper.AssertElementVisibility(
      this.locators.container,
    );
  }

  assertTabCount(count: number) {
    ObjectsRegistry.AggregateHelper.GetElement(this.locators.tabs).should(
      "have.length",
      count,
    );
  }

  switchToAddNew() {
    // for js it will directly add a new file
    cy.get("body").then(($body) => {
      if ($body.find(this.locators.addItem).length > 0) {
        ObjectsRegistry.AggregateHelper.GetNClick(
          this.locators.addItem,
          0,
          true,
        );
      }
    });
  }

  assertActiveTab(expectedTabName: string) {
    cy.get(this.locators.tabName(expectedTabName))
      .should("exist")
      .and("have.class", "active");
  }

  closeTab(name: string) {
    const tab = this.locators.tabName(name);
    ObjectsRegistry.AggregateHelper.HoverElement(tab);
    ObjectsRegistry.AggregateHelper.GetChildrenNClick(
      tab,
      this.locators.closeTab,
      0,
      true,
    );
  }
}

export default new FileTabs();
