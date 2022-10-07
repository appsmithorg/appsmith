/* eslint-disable cypress/no-unnecessary-waiting */
const widgetsPage = require("../../../../../locators/Widgets.json");
const commonlocators = require("../../../../../locators/commonlocators.json");
const publish = require("../../../../../locators/publishWidgetspage.json");
const dsl = require("../../../../../fixtures/swtchTableDsl.json");
const explorer = require("../../../../../locators/explorerlocators.json");

describe("Table Widget and Switch binding Functionality", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Table Widget Data validation with Switch ON", function() {
    cy.openPropertyPane("tablewidget");
    cy.readTabledataPublish("1", "1").then((tabData) => {
      const tabValue = tabData;
      expect(tabValue).to.be.equal("30");
      cy.log("the value is" + tabValue);
    });
    cy.get(".t--switch-widget-active .bp3-control-indicator").click({
      force: true,
    });
    cy.wait(5000);
    cy.readTabledataPublish("1", "1").then((tabData) => {
      const tabValue = tabData;
      expect(tabValue).to.be.equal("9");
      cy.log("the value is" + tabValue);
    });
    cy.get(".t--switch-widget-inactive .bp3-control-indicator").click({
      force: true,
    });
    cy.wait(5000);

    cy.readTabledataPublish("1", "1").then((tabData) => {
      const tabValue = tabData;
      expect(tabValue).to.be.equal("30");
      cy.log("the value is" + tabValue);
    });
  });

  it("Selected row and binding with Text widget", function() {
    cy.wait(5000);
    cy.get(".t--table-multiselect")
      .eq(1)
      .click({ force: true });
    cy.get(".t--draggable-textwidget .bp3-ui-text span").should(
      "contain.text",
      "30",
    );
    cy.get(".t--table-multiselect")
      .eq(0)
      .click({ force: true });
    cy.get(".t--draggable-textwidget .bp3-ui-text span").should(
      "contain.text",
      "29",
    );
  });

  afterEach(() => {
    // put your clean up code if any
  });
});
