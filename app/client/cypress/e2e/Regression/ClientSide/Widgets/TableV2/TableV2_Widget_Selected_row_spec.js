import {
  agHelper,
  entityExplorer,
} from "../../../../../support/Objects/ObjectsCore";

describe("Table Widget v2 property pane feature validation", function () {
  before(() => {
    agHelper.AddDsl("tableV2AndTextDsl");
  });

  it("1. Table widget v2 new menu button column should not deselect row", function () {
    entityExplorer.SelectEntityByName("Table1", "Widgets");
    cy.get(".t--widget-textwidget").should("have.text", "0");
    agHelper.ClickButton("Open Menu");
    cy.get(".t--widget-textwidget").should("have.text", "0");
  });
});
