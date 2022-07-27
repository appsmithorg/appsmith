import { ObjectsRegistry } from "../../../../support/Objects/Registry";
const commonLocators = require("../../../../locators/commonlocators.json");

const {
  AggregateHelper: agHelper,
  ApiPage: apiPage,
  EntityExplorer: entityExplorer,
  JSEditor: jsEditor,
} = ObjectsRegistry;

describe("Copy Action/JS objects to different pages", () => {
  it("1. copies Action object to a different page from the additional menu in Queries/JS section", () => {
    entityExplorer.AddNewPage();
    apiPage.CreateAndFillApi("https://randomuser.me/api/", "get_data");
    cy.wait(3000);

    entityExplorer.ExpandCollapseEntity("QUERIES/JS");
    entityExplorer.ActionContextMenuByEntityName("get_data", "Copy to page");
    cy.get(`${commonLocators.chooseAction}:contains("Page1")`).click({
      force: true,
    });

    cy.wait(2000);
    agHelper.ValidateToastMessage(
      "get_data action copied to page Page1 successfully",
    );
  });

  it("2. copies action object to a different page from the additional menu on Api Editor page", () => {
    entityExplorer.AddNewPage();

    apiPage.CreateAndFillApi("https://randomuser.me/api/", "get_data");
    cy.wait(3000);

    cy.get(".t--more-action-menu")
      .first()
      .click({ force: true });

    agHelper.SelectDropDown("Copy to page");
    agHelper.SelectDropDown("Page1");
    agHelper.ValidateToastMessage(
      "get_data action copied to page Page1 successfully",
    );
  });

  it("3. copies JS object to a different page from the additional menu in Queries/JS section", () => {
    entityExplorer.AddNewPage();

    cy.get(`${commonLocators.entityItem}:contains(Page1)`)
      .first()
      .click();
    cy.wait("@getPage");

    jsEditor.CreateJSObject('return "Hello World";');

    cy.get(`${commonLocators.entityItem}:contains('JSObject1')`).within(() => {
      cy.get(commonLocators.entityContextMenu).click({ force: true });
    });

    agHelper.SelectDropDown("Copy to page");
    cy.get(`${commonLocators.chooseAction}:contains("Page2")`).click({
      force: true,
    });

    cy.wait(2000);
    agHelper.ValidateToastMessage(
      "JSObject1 copied to page Page2 successfully",
    );
  });

  it("4. copies JS object to a different page from the additional menu on JS Editor page", () => {
    entityExplorer.AddNewPage();

    jsEditor.CreateJSObject('return "Hello World";');
    cy.wait(3000);

    cy.get(commonLocators.expandMore)
      .eq(1)
      .click({ force: true });

    cy.get(".t--more-action-menu")
      .first()
      .click({ force: true });

    agHelper.SelectDropDown("Copy to page");
    agHelper.SelectDropDown("Page1");
    agHelper.ValidateToastMessage(
      "JSObject1 copied to page Page1 successfully",
    );
  });
});
