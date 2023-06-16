import * as _ from "../../../../../support/Objects/ObjectsCore";

describe("Table Widget property pane feature validation", function () {
  before(() => {
    cy.fixture("tableAndTextDsl").then((val) => {
      _.agHelper.AddDsl(val);
    });
  });
  it("Table widget new menu button column should not deselect row", function () {
    cy.openPropertyPane("tablewidget");

    cy.get(".t--widget-textwidget").should("have.text", "0");
    cy.contains("Open Menu").click({
      force: true,
    });
    cy.wait(1000);
    cy.get(".t--widget-textwidget").should("have.text", "0");
  });
});
