const commonlocators = require("../../../../../../locators/commonlocators.json");
const widgetsPage = require("../../../../../../locators/Widgets.json");
import { ObjectsRegistry } from "../../../../../../support/Objects/Registry";

let dataSources = ObjectsRegistry.DataSources;

describe("Table widget - Select column type functionality", () => {
  before(() => {
    cy.dragAndDropToCanvas("tablewidgetv2", { x: 150, y: 300 });
  });

  it("1. should check that select column is available in the column dropdown options", () => {
    cy.openPropertyPane("tablewidgetv2");
    cy.editColumn("step");

    cy.get(commonlocators.changeColType)
      .last()
      .click();
    cy.get(".t--dropdown-option")
      .children()
      .contains("Select")
      .click();
    cy.wait("@updateLayout");
  });

  it("2. should check that edtiable option is present", () => {
    cy.get(".t--property-control-editable").should("exist");
    cy.get(".t--property-pane-section-collapse-events").should("not.exist");
    cy.get(".t--property-control-editable .bp3-switch span").click();
    cy.get(".t--property-pane-section-collapse-events").should("exist");
  });

  it("3. should check that options given in the property pane is appearing on the table", () => {
    cy.get(".t--property-control-options").should("exist");
    cy.updateCodeInput(
      ".t--property-control-options",
      `
      [
        {
          "label": "#1",
          "value": "#1"
        },
        {
          "label": "#2",
          "value": "#2"
        },
        {
          "label": "#3",
          "value": "#3"
        }
      ]
    `,
    );
    cy.editTableSelectCell(0, 0);

    [
      {
        label: "#1",
        value: "#1",
      },
      {
        label: "#2",
        value: "#2",
      },
      {
        label: "#3",
        value: "#3",
      },
    ].forEach((item) => {
      cy.get(".menu-item-text")
        .contains(item.value)
        .should("exist");
    });

    cy.get(".menu-item-active.has-focus").should("contain", "#1");
  });

  it("4. should check that placeholder property is working", () => {
    cy.updateCodeInput(
      ".t--property-control-options",
      `
      [
        {
          "label": "test",
          "value": "test"
        }
      ]
    `,
    );
    cy.wait(500);
    cy.editTableSelectCell(0, 0);
    cy.get(
      `[data-colindex="0"][data-rowindex="0"] .select-button .bp3-button-text`,
    ).should("contain", "-- Select --");

    cy.updateCodeInput(".t--property-control-placeholder", "choose an option");

    cy.editTableSelectCell(0, 0);
    cy.get(
      `[data-colindex="0"][data-rowindex="0"] .select-button .bp3-button-text`,
    ).should("contain", "choose an option");

    cy.updateCodeInput(".t--property-control-placeholder", "choose an item");

    cy.editTableSelectCell(0, 0);
    cy.get(
      `[data-colindex="0"][data-rowindex="0"] .select-button .bp3-button-text`,
    ).should("contain", "choose an item");
  });

  it("5. should check that filterable property is working", () => {
    cy.updateCodeInput(
      ".t--property-control-options",
      `
      {{[
        {
          label: "#1",
          value: "#1"
        },
        {
          label: "#2",
          value: "#2"
        },
        {
          label: "#3",
          value: "#3"
        }
      ]}}
    `,
    );
    cy.get(".t--property-control-filterable .bp3-switch span").click();
    cy.editTableSelectCell(0, 0);
    cy.get(".select-popover-wrapper .bp3-input-group input").should("exist");
    cy.get(".select-popover-wrapper .bp3-input-group input").type("1", {
      force: true,
    });

    cy.get(".menu-item-link").should("have.length", 1);
    cy.get(".menu-item-link").should("contain", "#1");

    cy.get(".select-popover-wrapper .bp3-input-group input")
      .clear()
      .type("3", { force: true });

    cy.get(".menu-item-link").should("have.length", 1);
    cy.get(".menu-item-link").should("contain", "#3");

    cy.get(".select-popover-wrapper .bp3-input-group input").clear();

    cy.get(".menu-item-link").should("have.length", 3);
    cy.get(".t--canvas-artboard").click({ force: true });
  });

  it("6. should check that on option select is working", () => {
    cy.openPropertyPane("tablewidgetv2");
    cy.editColumn("step");
    cy.get(".t--property-control-onoptionchange .t--js-toggle").click();
    cy.updateCodeInput(
      ".t--property-control-onoptionchange",
      `
      {{showAlert(currentRow.step)}}
    `,
    );
    cy.editTableSelectCell(0, 0);
    cy.get(".menu-item-link")
      .contains("#3")
      .click();

    cy.get(widgetsPage.toastAction).should("be.visible");
    cy.get(widgetsPage.toastActionText)
      .last()
      .invoke("text")
      .then((text) => {
        expect(text).to.equal("#3");
      });

    cy.get(".menu-virtual-list").should("not.exist");
    cy.readTableV2data(0, 0).then((val) => {
      expect(val).to.equal("#3");
    });
    cy.discardTableRow(4, 0);
  });

  it("7. should check that currentRow is accessible in the select options", () => {
    cy.updateCodeInput(
      ".t--property-control-options",
      `
      {{[
        {
          label: currentRow.step,
          value: currentRow.step
        }
      ]}}
    `,
    );
    cy.editTableSelectCell(0, 0);
    cy.get(".menu-item-text")
      .contains("#1")
      .should("exist");
    cy.get(".menu-item-text")
      .contains("#2")
      .should("not.exist");

    cy.editTableSelectCell(0, 1);
    cy.get(".menu-item-text")
      .contains("#2")
      .should("exist");
    cy.get(".menu-item-text")
      .contains("#1")
      .should("not.exist");

    cy.editTableSelectCell(0, 2);
    cy.get(".menu-item-text")
      .contains("#3")
      .should("exist");
    cy.get(".menu-item-text")
      .contains("#1")
      .should("not.exist");
  });

  it("8. should check that server side filering is working", () => {
    dataSources.CreateDataSource("Postgres");
    cy.get("@dsName").then(($dsName) => {
      dataSources.CreateNewQueryInDS(
        $dsName,
        "SELECT * FROM public.astronauts {{this.params.filterText ? `WHERE name LIKE '%${this.params.filterText}%'` : ''}} LIMIT 10;",
      );
    });
    cy.get(".t--form-control-SWITCH label")
      .scrollIntoView()
      .click({ force: true });
    cy.wait("@saveAction");
    cy.get(".t--run-query").click();
    cy.wait("@postExecute");
    cy.get("#switcher--widgets").click();
    cy.openPropertyPane("tablewidgetv2");
    cy.editColumn("step");
    cy.get(".t--property-control-serversidefiltering .bp3-switch span").click();
    cy.updateCodeInput(
      ".t--property-pane-section-selectproperties",
      `
      {{Query1.data.map((d) => ({
        label: d.name,
        value: d.name
      }))}}
    `,
    );

    cy.get(".t--property-control-onfilterupdate .t--js-toggle").click();
    cy.updateCodeInput(
      ".t--property-control-onfilterupdate",
      `
      {{Query1.run({filterText: filterText})}}
    `,
    );

    cy.editTableSelectCell(0, 0);
    cy.get(".select-popover-wrapper .bp3-input-group input").should("exist");
    cy.get(".select-popover-wrapper .bp3-input-group input").type("Ulf", {
      force: true,
    });

    cy.get(".menu-item-link").should("have.length", 1);
    cy.get(".menu-item-link").should("contain", "Ulf Merbold");

    cy.get(".select-popover-wrapper .bp3-input-group input")
      .clear()
      .type("Anil", { force: true });

    cy.get(".menu-item-link").should("have.length", 1);
    cy.get(".menu-item-link").should("contain", "Anil Menon");
  });
});
