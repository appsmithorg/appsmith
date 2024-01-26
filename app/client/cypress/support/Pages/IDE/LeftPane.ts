import { ObjectsRegistry } from "../../Objects/Registry";

export class LeftPane {
  segments?: string[];
  listItemSelector: (name: string) => string;

  locators = {
    segment: (name: string) => "//span[text()='" + name + "']/ancestor::div",
    expandCollapseArrow: (name: string) =>
      "//div[text()='" +
      name +
      "']/ancestor::div/span[contains(@class, 't--entity-collapse-toggle')]",
    addItem: "button.t--add-item",
    selector: "",
  };

  constructor(
    listItemSelector: (name: string) => string,
    selector: string,
    segments?: string[],
  ) {
    this.listItemSelector = listItemSelector;
    this.segments = segments;
    this.locators.selector = selector;
  }

  public assertAbsence(name: string) {
    ObjectsRegistry.AggregateHelper.AssertElementLength(
      this.listItemSelector(name),
      0,
    );
  }

  public assertPresence(name: string) {
    ObjectsRegistry.AggregateHelper.AssertElementLength(
      this.listItemSelector(name),
      1,
    );
  }

  public assertCount(name: string, count: number) {
    ObjectsRegistry.AggregateHelper.AssertElementLength(
      this.listItemSelector(name),
      count,
    );
  }

  public switchSegment(name: string) {
    if (!this.segments) {
      throw Error("No Segments configured");
    }
    ObjectsRegistry.AggregateHelper.GetNClick(this.locators.segment(name));
  }

  public selectItem(
    name: string,
    clickOptions?: Partial<Cypress.ClickOptions>,
  ) {
    cy.xpath(this.listItemSelector(name))
      .first()
      .click(
        clickOptions?.ctrlKey
          ? { ctrlKey: true, force: true }
          : { multiple: true, force: true },
      );
  }

  public expandCollapseItem(itemName: string, expand = true) {
    this.assertPresence(itemName);
    ObjectsRegistry.AggregateHelper.AssertElementVisibility(
      this.locators.expandCollapseArrow(itemName),
    );
    cy.xpath(this.locators.expandCollapseArrow(itemName))
      .invoke("attr", "id")
      .then((state) => {
        const closed = state === "arrow-right-s-line";
        const opened = state === "arrow-down-s-line";
        if ((expand && closed) || (!expand && opened)) {
          ObjectsRegistry.AggregateHelper.GetNClick(
            this.locators.expandCollapseArrow(itemName),
          );
        }
      });
  }

  public assertSelected(name: string) {
    // TODO
  }

  public switchToAddNew() {
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
