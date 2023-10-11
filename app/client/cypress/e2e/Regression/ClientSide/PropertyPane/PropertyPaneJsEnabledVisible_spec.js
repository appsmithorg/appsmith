import * as _ from "../../../../support/Objects/ObjectsCore";

describe("Property pane js enabled field", function () {
  before(() => {
    _.agHelper.AddDsl("jsonFormDslWithSchema");
  });

  it("1. Ensure text is visible for js enabled field when a section is collapsed by default", function () {
    _.entityExplorer.SelectEntityByName("JSONForm1");
    _.propPane.MoveToTab("Style");
    _.propPane.EnterJSContext("Button variant", "PRIMARY");
    cy.get(".t--property-pane-section-collapse-submitbuttonstyles").click();
    cy.closePropertyPane();
    cy.wait(1000);

    _.entityExplorer.SelectEntityByName("JSONForm1");
    _.propPane.MoveToTab("Style");
    cy.wait(500);
    cy.get(".t--property-pane-section-collapse-submitbuttonstyles").click();
    cy.get(".t--property-control-buttonvariant")
      .find(".CodeMirror-code")
      .invoke("text")
      .should("equal", "PRIMARY");
  });
});
