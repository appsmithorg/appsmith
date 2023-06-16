import {
  entityExplorer,
  agHelper,
  propPane,
} from "../../../../support/Objects/ObjectsCore";

describe("Property pane js enabled field", function () {
  before(() => {
    cy.fixture("jsonFormDslWithSchema").then((val) => {
      agHelper.AddDsl(val);
    });
  });

  it("1. Ensure text is visible for js enabled field when a section is collapsed by default", function () {
    entityExplorer.SelectEntityByName("JSONForm1");
    propPane.MoveToTab("Style");
    propPane.EnterJSContext("Button variant", "PRIMARY");
    cy.get(".t--property-pane-section-collapse-submitbuttonstyles").click();
    cy.closePropertyPane();
    cy.wait(1000);

    entityExplorer.SelectEntityByName("JSONForm1");
    propPane.MoveToTab("Style");
    cy.wait(500);
    cy.get(".t--property-pane-section-collapse-submitbuttonstyles").click();
    cy.get(".t--property-control-buttonvariant")
      .find(".CodeMirror-code")
      .invoke("text")
      .should("equal", "PRIMARY");
  });
});
