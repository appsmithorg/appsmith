const widgetsPage = require("../../../locators/Widgets.json");
const commonlocators = require("../../../locators/commonlocators.json");
const publish = require("../../../locators/publishWidgetspage.json");
const dsl = require("../../../fixtures/commondsl.json");

describe("Table Widget Functionality", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Table Widget Functionality", function() {
    cy.openPropertyPane("tablewidget");

    /**
     * @param{Text} Random Text
     * @param{ChartWidget}Mouseover
     * @param{ChartPre Css} Assertion
     */
    cy.widgetText("Table1", widgetsPage.tableWidget, commonlocators.tableInner);
    cy.testJsontext("tabledata", JSON.stringify(this.data.TableInput));
    cy.wait("@updateLayout");
    cy.ExportVerify(commonlocators.pdfSupport, "PDF Export");
    cy.ExportVerify(commonlocators.ExcelSupport, "Excel Export");
    cy.ExportVerify(commonlocators.csvSupport, "CSV Export");
    cy.get(widgetsPage.ColumnAction).click({ force: true });
    cy.readTabledata("1", "5").then(tabData => {
      const tabValue = tabData;
      expect(tabValue).to.be.equal("Action");
      cy.log("the value is" + tabValue);
    });
    cy.pageNo(2).should("be.visible");
    cy.openPropertyPane("tablewidget");
    cy.get(widgetsPage.tableOnRowSelected)
      .get(commonlocators.dropdownSelectButton)
      .first()
      .click({ force: true })
      .get(commonlocators.dropdownmenu)
      .children()
      .contains("Navigate To")
      .click();
    cy.wait("@updateLayout");
    cy.get(widgetsPage.tableOnRowSelected)
      .get(commonlocators.dropdownSelectButton)
      .first()
      .find("> .bp3-button-text")
      .should("have.text", "Navigate To");
    cy.get(commonlocators.editPropCrossButton).click();
    cy.PublishtheApp();
  });
  it("Table Widget Functionality To Verify The Data", function() {
    cy.isSelectRow(1);
    cy.readTabledataPublish("1", "2").then(tabData => {
      const tabValue = tabData;
      expect(tabValue).to.be.equal("Lindsay Ferguson");
      cy.log("the value is" + tabValue);
    });
  });
  it("Table Widget Functionality To Verify The PageNo", function() {
    cy.pageNo(2).should("be.visible");
    cy.get(publish.backToEditor).click();
  });
  it("Table Widget Functionality To Verify The Extension Support", function() {
    cy.openPropertyPane("tablewidget");
    cy.togglebar(commonlocators.pdfSupport);
    cy.PublishtheApp();
    cy.get(publish.tableWidget + " " + "button").should(
      "contain",
      "PDF Export",
    );
    cy.get(publish.backToEditor).click();
    cy.openPropertyPane("tablewidget");
    cy.togglebarDisable(commonlocators.pdfSupport);
    cy.togglebar(commonlocators.ExcelSupport);
    cy.PublishtheApp();
    cy.get(publish.tableWidget + " " + "button").should(
      "not.contain",
      "PDF Export",
    );
    cy.get(publish.tableWidget + " " + "button").should(
      "contain",
      "Excel Export",
    );
  });
});
Cypress.on("test:after:run", attributes => {
  /* eslint-disable no-console */
  console.log(
    'Test "%s" has finished in %dms',
    attributes.title,
    attributes.duration,
  );
});
afterEach(() => {
  // put your clean up code if any
});
