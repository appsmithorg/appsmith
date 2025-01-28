import { ObjectsRegistry } from "../../Objects/Registry";

class ListView {
  public locators = {
    list: "[data-testid='t--ide-list']",
    listItem: "[data-testid='t--ide-list-item']",
    addItem: "[data-testid='t--add-item']",
  };

  public assertListVisibility() {
    ObjectsRegistry.AggregateHelper.AssertElementVisibility(this.locators.list);
  }

  public assertItemVisibility(name: string) {
    ObjectsRegistry.AggregateHelper.GetNAssertElementText(
      this.locators.listItem,
      name,
    );
  }

  public getItem(name: string) {
    return ObjectsRegistry.AggregateHelper.GetElement(
      this.locators.listItem,
    ).should("have.text", name);
  }

  public assertItemCount(count: number) {
    return ObjectsRegistry.AggregateHelper.GetElement(
      this.locators.listItem,
    ).should("have.length", count);
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

export default ListView;
