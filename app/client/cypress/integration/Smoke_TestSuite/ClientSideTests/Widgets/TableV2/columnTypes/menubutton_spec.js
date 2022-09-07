import { ObjectsRegistry } from "../../../../../../support/Objects/Registry";

const propPane = ObjectsRegistry.PropertyPane;

describe("Custom column alias functionality", () => {
  before(() => {
    cy.dragAndDropToCanvas("tablewidgetv2", { x: 150, y: 300 });
  });

  it("1. should check that menuitems background color property has access to currentRow", () => {
    cy.openPropertyPane("tablewidgetv2");
    cy.editColumn("task");
    cy.changeColumnType("Menu Button");
    cy.get(".t--add-menu-item-btn").click();
    cy.get(".t--edit-column-btn").click();
    cy.get("[data-colindex='1'][data-rowindex='0'] .bp3-button").click({
      force: true,
    });
    cy.get(".table-menu-button-popover li a").should(
      "have.css",
      "background-color",
      "rgb(255, 255, 255)",
    );
    cy.get("[data-colindex='1'][data-rowindex='1'] .bp3-button").click({
      force: true,
    });
    cy.get(".table-menu-button-popover li a").should(
      "have.css",
      "background-color",
      "rgb(255, 255, 255)",
    );
    cy.get(".t--property-control-backgroundcolor .t--js-toggle").click();
    propPane.UpdatePropertyFieldValue(
      "Background color",
      "{{currentRow.step === '#1' ? '#f00' : '#0f0'}}",
    );
    cy.wait(2000);
    cy.get("[data-colindex='1'][data-rowindex='0'] .bp3-button").click({
      force: true,
    });
    cy.get(".table-menu-button-popover li a").should(
      "have.css",
      "background-color",
      "rgb(255, 0, 0)",
    );
    cy.get("[data-colindex='1'][data-rowindex='1'] .bp3-button").click({
      force: true,
    });
    cy.get(".table-menu-button-popover li a").should(
      "have.css",
      "background-color",
      "rgb(0, 255, 0)",
    );
  });

  it("2. should check that menuitems text color property has access to currentRow", () => {
    cy.get("[data-colindex='1'][data-rowindex='0'] .bp3-button").click({
      force: true,
    });
    cy.get(".table-menu-button-popover li a").should(
      "have.css",
      "color",
      "rgb(24, 32, 38)",
    );
    cy.get("[data-colindex='1'][data-rowindex='1'] .bp3-button").click({
      force: true,
    });
    cy.get(".table-menu-button-popover li a").should(
      "have.css",
      "color",
      "rgb(24, 32, 38)",
    );
    cy.get(".t--property-control-textcolor .t--js-toggle").click();
    propPane.UpdatePropertyFieldValue(
      "Text color",
      "{{currentRow.step === '#1' ? '#f00' : '#0f0'}}",
    );
    cy.wait(2000);
    cy.get("[data-colindex='1'][data-rowindex='0'] .bp3-button").click({
      force: true,
    });
    cy.get(".table-menu-button-popover li a").should(
      "have.css",
      "color",
      "rgb(255, 0, 0)",
    );
    cy.get("[data-colindex='1'][data-rowindex='1'] .bp3-button").click({
      force: true,
    });
    cy.get(".table-menu-button-popover li a").should(
      "have.css",
      "color",
      "rgb(0, 255, 0)",
    );
  });

  it("3. should check that menuitems isDisabled property has access to currentRow", () => {
    cy.get("[data-colindex='1'][data-rowindex='0'] .bp3-button").click({
      force: true,
    });
    cy.get(".table-menu-button-popover li a").should(
      "have.css",
      "background-color",
      "rgb(255, 0, 0)",
    );
    cy.get("[data-colindex='1'][data-rowindex='1'] .bp3-button").click({
      force: true,
    });
    cy.get(".table-menu-button-popover li a").should(
      "have.css",
      "background-color",
      "rgb(0, 255, 0)",
    );
    cy.get(".t--property-control-disabled .t--js-toggle").click();
    propPane.UpdatePropertyFieldValue(
      "Disabled",
      "{{currentRow.step === '#1'}}",
    );
    cy.wait(2000);
    cy.get("[data-colindex='1'][data-rowindex='0'] .bp3-button").click({
      force: true,
    });
    cy.get(".table-menu-button-popover li a").should(
      "have.css",
      "background-color",
      "rgb(250, 250, 250)",
    );
    cy.get("[data-colindex='1'][data-rowindex='1'] .bp3-button").click({
      force: true,
    });
    cy.get(".table-menu-button-popover li a").should(
      "have.css",
      "background-color",
      "rgb(0, 255, 0)",
    );
  });

  it("4. should check that menuitems visible property has access to currentRow", () => {
    cy.get("[data-colindex='1'][data-rowindex='0'] .bp3-button").click({
      force: true,
    });
    cy.get(".table-menu-button-popover li a").should("exist");
    cy.get("[data-colindex='1'][data-rowindex='1'] .bp3-button").click({
      force: true,
    });
    cy.get(".table-menu-button-popover li a").should("exist");
    cy.get(".t--property-control-visible .t--js-toggle").click();
    propPane.UpdatePropertyFieldValue(
      "Visible",
      "{{currentRow.step === '#1'}}",
    );
    cy.wait(2000);
    cy.get("[data-colindex='1'][data-rowindex='0'] .bp3-button").click({
      force: true,
    });
    cy.get(".table-menu-button-popover li a").should("exist");
    cy.get("[data-colindex='1'][data-rowindex='1'] .bp3-button").click({
      force: true,
    });
    cy.get(".table-menu-button-popover li a").should("not.exist");
  });
});
