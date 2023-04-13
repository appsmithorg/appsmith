import { ObjectsRegistry } from "../../../../../support/Objects/Registry";

const PropertyPane = ObjectsRegistry.PropertyPane;
const totalRows = 100;

describe("Table Widget Virtualized Row", function () {
  before(() => {
    cy.dragAndDropToCanvas("tablewidgetv2", { x: 300, y: 600 });
    const row = {
      step: "#3",
      task: "Bind the query using => fetch_users.data",
      status: "--",
      action: "",
    };

    const rows = new Array(totalRows).fill("").map((d, i) => ({
      ...row,
      step: i,
    }));

    PropertyPane.UpdatePropertyFieldValue("Table Data", JSON.stringify(rows));
    PropertyPane.ToggleOnOrOff("Server Side Pagination", "On");
    PropertyPane.ToggleOnOrOff("Show Pagination", "Off");
  });

  it("1. should check that row is getting rendered", () => {
    cy.get(".tr[data-rowindex]").should("exist");
    cy.get(".td[data-rowindex]").should("exist");
  });

  it("2. should check that virtual rows are getting rendered when scrolling through the table", () => {
    cy.get(".tr[data-rowindex]").should("not.have.length", totalRows);
    cy.get(".tr[data-rowindex='0']").should("exist");
    cy.get(".virtual-list.simplebar-content").scrollTo("bottom");
    cy.wait(500);
    cy.get(".tr[data-rowindex='0']").should("not.exist");
    cy.get(".tr[data-rowindex='98']").should("exist");
    cy.get(".virtual-list.simplebar-content").scrollTo("top");
    cy.wait(500);
    cy.get(".tr[data-rowindex='0']").should("exist");
    cy.get(".tr[data-rowindex='98']").should("not.exist");
    cy.get(".t--virtual-row").should("exist");
  });

  it("3. should check that virtual rows feature is turned off when cell wrapping is enabled", () => {
    cy.editColumn("step");
    cy.wait(500);
    PropertyPane.ToggleOnOrOff("Cell Wrapping", "On");
    cy.get(".tr[data-rowindex]").should("have.length", totalRows);
    cy.get(".tr[data-rowindex='0']").should("exist");
    cy.get(".tr[data-rowindex='98']").should("exist");
    cy.get(".table .simplebar-content-wrapper").scrollTo("bottom");
    cy.wait(500);
    cy.get(".tr[data-rowindex='0']").should("exist");
    cy.get(".tr[data-rowindex='98']").should("exist");
    cy.get(".table .simplebar-content-wrapper").scrollTo("top");
    cy.wait(500);
    cy.get(".tr[data-rowindex='0']").should("exist");
    cy.get(".tr[data-rowindex='98']").should("exist");
    cy.get(".t--virtual-row").should("not.exist");
  });

  it("4. should check that virtual rows feature is turned off when server side pagination is disabled", () => {
    PropertyPane.ToggleOnOrOff("Cell Wrapping", "Off");
    PropertyPane.NavigateBackToPropertyPane();
    cy.wait(500);
    PropertyPane.ToggleOnOrOff("Show Pagination", "On");
    cy.wait(500);
    PropertyPane.ToggleOnOrOff("Server Side Pagination", "Off");
    cy.get(".tr[data-rowindex]").should("have.length", 5);
    cy.get(".t--virtual-row").should("not.exist");
  });
});
