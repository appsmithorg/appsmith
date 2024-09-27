import { ObjectsRegistry } from "../../Objects/Registry";
import { PagePaneSegment } from "../EditorNavigation";
import AddView from "./AddView";
import FileTabs from "./FileTabs";
import ListView from "./ListView";

export class LeftPane {
  segments?: string[];
  listItemSelector: (name: string) => string;

  locators = {
    segment: (name: string) => "//span[text()='" + name + "']/ancestor::div",
    expandCollapseArrow: (name: string) =>
      "//div[text()='" +
      name +
      "']/ancestor::div/span[contains(@class, 't--entity-collapse-toggle')]",
    activeItemSelector: "",
    selector: "",
  };
  public listView: ListView;

  constructor(
    listItemSelector: (name: string) => string,
    selector: string,
    activeItemSelector: string,
    segments?: string[],
  ) {
    this.listItemSelector = listItemSelector;
    this.segments = segments;
    this.locators.selector = selector;
    this.locators.activeItemSelector = activeItemSelector;
    this.listView = new ListView();
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
    ObjectsRegistry.AggregateHelper.GetElement(
      this.locators.segment(name),
    ).then(($body) => {
      if ($body.first().attr("data-selected") !== "true") {
        ObjectsRegistry.AggregateHelper.GetNClick(this.locators.segment(name));
      }
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

  public selectedItem(
    exists?: "exist" | "not.exist" | "noVerify",
  ): Cypress.Chainable {
    return ObjectsRegistry.AggregateHelper.GetElement(
      this.locators.activeItemSelector,
      exists,
    );
  }

  public assertSelected(name: string) {
    // TODO
  }

  public switchToAddNew() {
    this.listView.switchToAddNew();
  }

  public assertInAddView() {
    AddView.assertInAddView();
  }

  public closeAddView() {
    AddView.closeAddView();
  }

  public clickCreateOption(name: string) {
    return AddView.clickCreateOption(name);
  }

  public assertInListView() {
    this.listView.assertListVisibility();
  }

  public assertItemCount(count: number) {
    this.listView.assertItemCount(count);
  }

  public assertSelectedSegment(name: string) {
    ObjectsRegistry.AggregateHelper.GetElement(
      this.locators.segment(name),
    ).should("have.attr", "data-selected", "true");
  }

  public assertAbsenceOfAddNew() {
    ObjectsRegistry.AggregateHelper.AssertElementAbsence(
      this.listView.locators.addItem,
    );
  }
}
