const dsl = require("../../../../fixtures/TextTabledsl.json");
import { entityExplorer } from "../../../../support/Objects/ObjectsCore";

describe("Property pane CTA to add an action", function () {
  before(() => {
    cy.addDsl(dsl);
  });

  it("1. Check if CTA is shown when there is no action", function () {
    entityExplorer.SelectEntityByName("Table1","Container3");
    cy.get(".t--propertypane-connect-cta")
      .scrollIntoView()
      .should("be.visible");
    //Check if CTA does not exist when there is an action
    cy.NavigateToAPI_Panel();
    cy.CreateAPI("FirstAPI");
    entityExplorer.NavigateToSwitcher("Widgets");
    entityExplorer.SelectEntityByName("Table1", "Container3");
    cy.get(".t--propertypane-connect-cta").should("not.exist");
  });
});
