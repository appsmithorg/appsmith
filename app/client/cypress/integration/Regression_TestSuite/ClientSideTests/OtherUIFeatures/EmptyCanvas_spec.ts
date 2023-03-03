import { WIDGET } from "../../../../locators/WidgetLocators";
import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const {
  AggregateHelper: agHelper,
  CommonLocators: locators,
  EntityExplorer: ee,
} = ObjectsRegistry;

describe("Empty canvas ctas", () => {
  beforeEach(() => {
    agHelper.RestoreLocalStorageCache();
  });

  afterEach(() => {
    agHelper.SaveLocalStorageCache();
  });

  it("Ctas should not be shown in the second page", () => {
    cy.get(locators._emptyCanvasCta).should("be.visible");
    ee.AddNewPage();
    cy.get(locators._emptyCanvasCta).should("not.exist");
    ee.SelectEntityByName("Page1", "Pages");
  });
  it("Ctas should continue to show on refresh", () => {
    cy.get(locators._emptyCanvasCta).should("be.visible");
    cy.reload();
    cy.get(locators._emptyCanvasCta).should("be.visible");
  });
  it("Hide cta on adding a widget", () => {
    cy.get(locators._emptyCanvasCta).should("be.visible");
    ee.DragDropWidgetNVerify(WIDGET.BUTTON, 200, 200);
    cy.get(locators._emptyCanvasCta).should("not.exist");
    ee.AddNewPage();
    cy.get(locators._emptyCanvasCta).should("not.exist");
  });
});
