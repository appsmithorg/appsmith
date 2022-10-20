import { ObjectsRegistry } from "../../../../../support/Objects/Registry";

const propPane = ObjectsRegistry.PropertyPane;

describe("Table widget v2", function() {
  it("1. should test that pageSize is computed properly for all the row sizes", function() {
    cy.dragAndDropToCanvas("textwidget", { x: 300, y: 100 });
    cy.openPropertyPane("textwidget");
    propPane.UpdatePropertyFieldValue("Text", "{{Table1.pageSize}}");
    cy.dragAndDropToCanvas("tablewidgetv2", { x: 300, y: 300 });
    cy.openPropertyPane("tablewidgetv2");

    cy.moveToStyleTab();
    cy.get(".t--button-tab-SHORT").click({ force: true });
    cy.get(".t--widget-textwidget .bp3-ui-text").should("contain", "7");

    cy.get(".t--button-tab-DEFAULT").click({ force: true });
    cy.get(".t--widget-textwidget .bp3-ui-text").should("contain", "5");

    cy.get(".t--button-tab-TALL").click({ force: true });
    cy.get(".t--widget-textwidget .bp3-ui-text").should("contain", "4");
  });
});
