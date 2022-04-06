const widgetsPage = require("../../../../locators/Widgets.json");
const commonlocators = require("../../../../locators/commonlocators.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const dsl = require("../../../../fixtures/tableWidgetDsl.json");

describe("Table Widget Filter Functionality", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("1. Table Widget Functionality", function() {
    cy.openPropertyPane("tablewidget");
    cy.widgetText("Table1", widgetsPage.tableWidget, commonlocators.tableInner);
    cy.testJsontext("tabledata", JSON.stringify(this.data.TableInput));
    cy.wait("@updateLayout");
  });

  it("2. Table Widget Search Functionality & Validate download csv and download Excel", function() {
    //cy.isSelectRow(1);
    cy.readTabledataPublish("1", "3").then((tabData) => {
      const tabValue = tabData;
      expect(tabValue).to.be.equal("Lindsay Ferguson");
      cy.log("the value is" + tabValue);
      cy.get(publish.searchInput)
        .first()
        .type(tabData);
      cy.wait(1000);
      cy.readTabledataPublish("0", "3").then((tabData) => {
        const tabValue = tabData;
        expect(tabValue).to.be.equal("Lindsay Ferguson");
      });
      cy.downloadData("Download as CSV");
      cy.wait(2000);

      //This plugin works only from cypress ^9.2
      //cy.verifyDownload("Table1.csv")

      cy.validateDownload("Table1.csv");

      cy.downloadData("Download as Excel");
      cy.wait(2000);
      cy.validateDownload("Table1.xlsx");

      cy.get(publish.searchInput)
        .first()
        .within(() => {
          return cy.get("input").clear();
        })
        .wait(1000)
        .type("7434532")
        .wait(1000);
      cy.readTabledataPublish("0", "3").then((tabData) => {
        const tabValue = tabData;
        expect(tabValue).to.be.equal("Byron Fields");
      });
    });
  });

  it("4. Table Widget Functionality To Filter The Data using OR operator ", function() {
    cy.get(publish.searchInput)
      .first()
      .within(() => {
        return cy.get("input").clear();
      })
      .wait(1000);

    //cy.isSelectRow(1);
    cy.readTabledataPublish("1", "3").then((tabData) => {
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
        .contains("contains")
        .click();
      cy.get(publish.inputValue).type("Tobias Funke");

      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(500);
      cy.AddFilterWithOperator(
        "OR",
        "email",
        "contains",
        "ryan.holmes@reqres.in",
      );
      cy.wait(500);
      cy.get(widgetsPage.filterApplyBtn).click({ force: true });
      cy.wait(500);

      cy.readTabledataPublish("0", "3").then((tabData) => {
        const tabValue = tabData;
        expect(tabValue).to.be.equal("Tobias Funke");
      });

      cy.readTabledataPublish("1", "3").then((tabData) => {
        const tabValue = tabData;
        expect(tabValue).to.be.equal("Ryan Holmes");
      });

      cy.get(widgetsPage.filterCloseBtn).click({ force: true });
      cy.get(publish.filterBtn).click();
      cy.get(publish.removeFilter)
        .first()
        .click({ force: true });
      cy.get(publish.removeFilter)
        .last()
        .click({ force: true });
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(500);
      cy.readTabledataPublish("0", "3").then((tabData) => {
        const tabValue = tabData;
        expect(tabValue).to.be.equal("Michael Lawson");
      });
      cy.get(publish.canvas)
        .first()
        .click({ force: true });
    });
  });

  it("Table Widget Functionality To Filter The Data using AND operator ", function() {
    //cy.isSelectRow(1);
    cy.readTabledataPublish("1", "3").then((tabData) => {
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
        .contains("contains")
        .click();
      cy.get(publish.inputValue).type("Tobias Funke");

      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(500);
      cy.AddFilterWithOperator(
        "AND",
        "email",
        "contains",
        "tobias.funke@reqres.in",
      );
      cy.wait(500);
      cy.get(widgetsPage.filterApplyBtn).click({ force: true });
      cy.wait(500);
      cy.readTabledataPublish("0", "3").then((tabData) => {
        const tabValue = tabData;
        expect(tabValue).to.be.equal("Tobias Funke");
      });

      cy.get(widgetsPage.filterCloseBtn).click({ force: true });
      cy.get(publish.filterBtn).click();
      cy.get(publish.removeFilter)
        .first()
        .click({ force: true });
      cy.get(publish.removeFilter)
        .last()
        .click({ force: true });
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(500);
      cy.readTabledataPublish("0", "3").then((tabData) => {
        const tabValue = tabData;
        expect(tabValue).to.be.equal("Michael Lawson");
      });
      cy.get(publish.canvas)
        .first()
        .click({ force: true });
    });
  });

  it("Table Widget Functionality To Filter The Data using OR operator with different data ", function() {
    //cy.isSelectRow(1);
    cy.readTabledataPublish("1", "3").then((tabData) => {
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
        .contains("contains")
        .click();
      cy.get(publish.inputValue).type("Lindsay Ferguson");

      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(500);
      cy.AddFilterWithOperator(
        "OR",
        "email",
        "contains",
        "tobias.funke@reqres.in",
      );
      cy.wait(500);
      cy.get(widgetsPage.filterApplyBtn).click({ force: true });
      cy.wait(500);
      cy.readTabledataPublish("0", "3").then((tabData) => {
        const tabValue = tabData;
        expect(tabValue).to.be.equal("Lindsay Ferguson");
      });
      cy.readTabledataPublish("1", "3").then((tabData) => {
        const tabValue = tabData;
        expect(tabValue).to.be.equal("Tobias Funke");
      });
      cy.get(widgetsPage.filterCloseBtn).click({ force: true });
      cy.get(publish.filterBtn).click();
      cy.get(publish.removeFilter)
        .first()
        .click({ force: true });
      cy.wait(500);
      cy.get(publish.removeFilter)
        .last()
        .click({ force: true });
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(1000);
      cy.readTabledataPublish("0", "3").then((tabData) => {
        const tabValue = tabData;
        expect(tabValue).to.be.equal("Michael Lawson");
      });
      cy.get(publish.canvas)
        .first()
        .click({ force: true });
    });
  });

  afterEach(() => {
    // put your clean up code if any
  });
});
