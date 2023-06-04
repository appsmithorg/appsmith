import * as _ from "../../../../support/Objects/ObjectsCore";

describe("Property pane CTA to add an action", function () {
  before(() => {
    cy.fixture("TextTabledsl").then((val) => {
      _.agHelper.AddDsl(val);
    });
  });

  it("1. Check if CTA is shown when there is no action", function () {
    cy.openPropertyPane("tablewidget");
    cy.get(".t--propertypane-connect-cta")
      .scrollIntoView()
      .should("be.visible");
    //Check if CTA does not exist when there is an action
    _.apiPage.CreateApi("FirstAPI");
    _.entityExplorer.NavigateToSwitcher("Widgets");
    _.entityExplorer.SelectEntityByName("Table1", "Container3");
    cy.get(".t--propertypane-connect-cta").should("not.exist");
  });
});
