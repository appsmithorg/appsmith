import * as _ from "../../../../../support/Objects/ObjectsCore";

describe("Table Widget v2 property pane feature validation", function () {
  before(() => {
    cy.fixture("tableV2AndTextDsl").then((val) => {
      _.agHelper.AddDsl(val);
    });
  });

  it("1. Table widget v2 new menu button column should not deselect row", function () {
    cy.openPropertyPane("tablewidgetv2");

    cy.get(".t--widget-textwidget").should("have.text", "0");
    cy.contains("Open Menu").click({
      force: true,
    });
    cy.wait(1000);
    cy.get(".t--widget-textwidget").should("have.text", "0");
  });
});
