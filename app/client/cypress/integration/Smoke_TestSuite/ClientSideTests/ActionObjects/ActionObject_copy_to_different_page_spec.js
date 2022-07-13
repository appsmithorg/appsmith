const commonLocators = require("../../../../locators/commonlocators.json");
import { ObjectsRegistry } from "../../../../support/Objects/Registry";
let entityExplorer = ObjectsRegistry.EntityExplorer;

describe("Copy Action objects to different pages", () => {
  it("copies Action object to a different page from the additional menu in Queries/JS section", () => {
    cy.Createpage("Page2");
    cy.NavigateToAPI_Panel();
    cy.CreateAPI("get_data");
    cy.wait(3000);

    cy.CheckAndUnfoldEntityItem("QUERIES/JS");
    entityExplorer.ActionContextMenuByEntityName("get_data", "Copy to page");
    cy.get(`${commonLocators.chooseAction}:contains("Page1")`).click({
      force: true,
    });

    cy.wait(2000);
    cy.validateToastMessage(
      "get_data action copied to page Page1 successfully",
    );
  });

  it("copies action object to a different page from the additional menu on Api Editor page", () => {
    cy.Createpage("Page2");

    cy.NavigateToAPI_Panel();
    cy.CreateAPI("get_data");
    cy.wait(3000);

    cy.get(".t--more-action-menu")
      .first()
      .click();

    cy.selectAction("Copy to page");
    cy.selectAction("Page1");
    cy.validateToastMessage(
      "get_data action copied to page Page1 successfully",
    );
  });
});
