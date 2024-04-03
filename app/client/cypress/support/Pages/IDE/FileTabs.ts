import { ObjectsRegistry } from "../../Objects/Registry";
class FileTabs {
  locators = {
    container: "[data-testid='t--editor-tabs']",
    tabName: (name: string) => `[data-testid='t--ide-tab-${name}']`,
    tabs: ".editor-tab",
    addItem: "[data-testid='t--ide-split-screen-add-button']",
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
}

export default new FileTabs();
