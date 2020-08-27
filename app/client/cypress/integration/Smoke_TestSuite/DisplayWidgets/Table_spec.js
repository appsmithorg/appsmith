const widgetsPage = require("../../../locators/Widgets.json");
const commonlocators = require("../../../locators/commonlocators.json");
const publish = require("../../../locators/publishWidgetspage.json");
const dsl = require("../../../fixtures/tableWidgetDsl.json");
const pages = require("../../../locators/Pages.json");

describe("Table Widget Functionality", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Table Widget Functionality", function() {
    cy.get(pages.widgetsEditor).click();
    cy.openPropertyPane("tablewidget");

    /**
     * @param{Text} Random Text
     * @param{ChartWidget}Mouseover
     * @param{ChartPre Css} Assertion
     */
    cy.widgetText("Table1", widgetsPage.tableWidget, commonlocators.tableInner);
    cy.testJsontext("tabledata", JSON.stringify(this.data.TableInput));
    cy.wait("@updateLayout");
    // cy.ExportVerify(commonlocators.pdfSupport, "PDF Export");
    // cy.ExportVerify(commonlocators.ExcelSupport, "Excel Export");
    // cy.ExportVerify(commonlocators.csvSupport, "CSV Export");
    cy.get(widgetsPage.ColumnAction).click({ force: true });
    // cy.readTabledata("1", "5").then(tabData => {
    //   const tabValue = tabData;
    //   expect(tabValue).to.be.equal("Action");
    //   cy.log("the value is" + tabValue);
    // });
    /*
    cy.openPropertyPane("tablewidget");
      */
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
      .should("have.text", "{{navigateTo()}}");
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

  it("Table Widget Functionality To Search The Data", function() {
    cy.isSelectRow(1);
    cy.readTabledataPublish("1", "2").then(tabData => {
      const tabValue = tabData;
      expect(tabValue).to.be.equal("Lindsay Ferguson");
      cy.log("the value is" + tabValue);
      cy.get(publish.searchInput)
        .first()
        .type(tabData);
      cy.wait(500);
      cy.readTabledataPublish("0", "2").then(tabData => {
        const tabValue = tabData;
        expect(tabValue).to.be.equal("Lindsay Ferguson");
      });
      cy.get(publish.downloadBtn).click();
      cy.wait(5000);
      cy.get(publish.searchInput)
        .first()
        .clear()
        .type("7434532");
      cy.wait(1000);
      cy.readTabledataPublish("0", "2").then(tabData => {
        const tabValue = tabData;
        expect(tabValue).to.be.equal("Byron Fields");
      });
    });
  });

  it("Table Widget Functionality To Filter The Data", function() {
    cy.get(publish.searchInput)
      .first()
      .clear();
    cy.wait(1000);
    cy.isSelectRow(1);
    cy.readTabledataPublish("1", "2").then(tabData => {
      const tabValue = tabData;
      expect(tabValue).to.be.equal("Lindsay Ferguson");
      cy.log("the value is" + tabValue);
      cy.get(publish.filterBtn).click();
      cy.get(publish.attributeDropdown).click();
      cy.get(publish.attributeValue)
        .contains("userName")
        .click();
      cy.get(publish.conditionDropdown).click();
      cy.get(publish.attributeValue)
        .contains("is exactly")
        .click();
      cy.get(publish.inputValue).type(tabValue);
      cy.wait(500);
      cy.get(publish.canvas)
        .first()
        .click();
      cy.readTabledataPublish("0", "2").then(tabData => {
        const tabValue = tabData;
        expect(tabValue).to.be.equal("Lindsay Ferguson");
      });
      cy.get(publish.filterBtn).click();
      cy.get(publish.removeFilter).click();
      cy.wait(500);
      cy.readTabledataPublish("0", "2").then(tabData => {
        const tabValue = tabData;
        expect(tabValue).to.be.equal("Michael Lawson");
      });
    });
  });

  it("Table Widget Functionality To Check Compact Mode", function() {
    cy.isSelectRow(1);
    cy.readTabledataPublish("1", "2").then(tabData => {
      const tabValue = tabData;
      expect(tabValue).to.be.equal("Lindsay Ferguson");
      cy.log("the value is" + tabValue);
      cy.get(publish.compactMode).click();
      cy.get(publish.compactOpt)
        .contains("Tall")
        .click();
      cy.scrollTabledataPublish("3", "2").then(tabData => {
        const tabValue = tabData;
        expect(tabValue).to.be.equal("Byron Fields");
      });
      cy.get(publish.compactMode).click();
      cy.get(publish.compactOpt)
        .contains("Short")
        .click();
      cy.readTabledataPublish("4", "2").then(tabData => {
        const tabValue = tabData;
        expect(tabValue).to.be.equal("Ryan Holmes");
      });
    });
  });

  it("Table Widget Functionality To Verify The PageNo", function() {
    cy.get(publish.backToEditor)
      .first()
      .click();
  });
  // it("Table Widget Functionality To Verify The Extension Support", function() {
  //   cy.openPropertyPane("tablewidget");
  //   cy.togglebar(commonlocators.pdfSupport);
  //   cy.PublishtheApp();
  //   cy.get(publish.tableWidget + " " + "button").should(
  //     "contain",
  //     "PDF Export",
  //   );
  //   cy.get(publish.backToEditor).click();
  //   cy.openPropertyPane("tablewidget");
  //   cy.togglebarDisable(commonlocators.pdfSupport);
  //   cy.togglebar(commonlocators.ExcelSupport);
  //   cy.PublishtheApp();
  //   cy.get(publish.tableWidget + " " + "button").should(
  //     "not.contain",
  //     "PDF Export",
  //   );
  //   cy.get(publish.tableWidget + " " + "button").should(
  //     "contain",
  //     "Excel Export",
  //   );
  // });
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

Cypress.on("test:after:run", attributes => {
  /* eslint-disable no-console */
  console.log(
    'Test "%s" has finished in %dms',
    attributes.title,
    attributes.duration,
  );
});
