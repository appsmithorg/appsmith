/* eslint-disable cypress/no-unnecessary-waiting */
const widgetsPage = require("../../../../locators/Widgets.json");
const commonlocators = require("../../../../locators/commonlocators.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const dsl = require("../../../../fixtures/tableResizeDsl.json");

describe("Table Widget Resize Functionality", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Table Widget check default header controls", function() {
    cy.get(`${commonlocators.layoutControls} span[name='desktop']`).click();
    cy.get(`${publish.tableWidget} ${publish.searchInput}`).should("exist");
    cy.get(
      `${publish.tableWidget} ${widgetsPage.tableFilterPaneToggle}`,
    ).should("exist");
    cy.get(`${publish.tableWidget} ${publish.downloadBtn}`).should("exist");
  });

  it("Table Widget check header controls after resize", function() {
    cy.get(`${commonlocators.layoutControls} span[name='mobile']`).click();
    cy.get(`${publish.tableWidget} ${publish.searchInput}`).should("not.exist");
    cy.get(
      `${publish.tableWidget} ${widgetsPage.tableFilterPaneToggle}`,
    ).should("not.exist");
    cy.get(`${publish.tableWidget} ${publish.downloadBtn}`).should("not.exist");
  });
});
