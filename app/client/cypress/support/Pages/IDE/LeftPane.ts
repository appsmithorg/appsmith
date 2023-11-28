import { ObjectsRegistry } from "../../Objects/Registry";

export class LeftPane {
  segments?: string[];
  listItemSelector: (name: string) => string;

  locators = {
    segment: (name: string) => "//span[text()='" + name + "']/ancestor::div",
  };

  constructor(listItemSelector: (name: string) => string, segments?: string[]) {
    this.listItemSelector = listItemSelector;
    this.segments = segments;
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
    ObjectsRegistry.AggregateHelper.GetAttribute(
      this.locators.segment(name),
      "data-selected",
    ).then(($value) => {
      if ($value === "true") return;
      else
        ObjectsRegistry.AggregateHelper.GetNClick(this.locators.segment(name));
    });
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

  public assertSelected(name: string) {
    // TODO
  }
}
