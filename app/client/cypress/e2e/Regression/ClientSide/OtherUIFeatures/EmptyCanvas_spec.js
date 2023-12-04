import { WIDGET } from "../../../../locators/WidgetLocators";
import { ObjectsRegistry } from "../../../../support/Objects/Registry";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";
import PageList from "../../../../support/Pages/PageList";

const { CommonLocators: locators, EntityExplorer: ee } = ObjectsRegistry;

describe("Empty canvas ctas", () => {
  it("1. Ctas validations", () => {
    cy.wait(3000); // for page to load, failing in CI
    //Ctas should not be shown in the second page
    cy.get(locators._emptyCanvasCta).should("be.visible");
    PageList.AddNewPage();
    cy.get(locators._emptyCanvasCta).should("not.exist");
    EditorNavigation.SelectEntityByName("Page1", EntityType.Page);

    //Ctas should continue to show on refresh
    cy.get(locators._emptyCanvasCta).should("be.visible");
    cy.reload();
    cy.get(locators._emptyCanvasCta).should("be.visible");

    //Hide cta on adding a widget
    cy.get(locators._emptyCanvasCta).should("be.visible");
    ee.DragDropWidgetNVerify(WIDGET.BUTTON, 200, 200);
    cy.get(locators._emptyCanvasCta).should("not.exist");
    PageList.AddNewPage();
    cy.get(locators._emptyCanvasCta).should("not.exist");
  });
});
