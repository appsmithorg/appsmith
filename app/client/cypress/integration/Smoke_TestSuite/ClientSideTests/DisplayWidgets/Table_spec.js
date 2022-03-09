/* eslint-disable cypress/no-unnecessary-waiting */
const widgetsPage = require("../../../../locators/Widgets.json");
const commonlocators = require("../../../../locators/commonlocators.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const dsl = require("../../../../fixtures/tableWidgetDsl.json");
const explorer = require("../../../../locators/explorerlocators.json");

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
    //cy.get(widgetsPage.ColumnAction).click({ force: true });
    // cy.get(widgetsPage.tableOnRowSelected)
    //   .get(commonlocators.dropdownSelectButton)
    //   .first()
    //   .click({ force: true })
    //   .get(commonlocators.dropdownmenu)
    //   .children()
    //   .contains("Navigate to")
    //   .click();
    // cy.wait("@updateLayout");
    // cy.get(widgetsPage.tableOnRowSelected)
    //   .get(commonlocators.dropdownSelectButton)
    //   .first()
    //   .find("> .bp3-button-text")
    //   .should("have.text", "{{navigateTo()}}");
  });

  it("Table Widget Functionality To Verify The Data", function() {
    cy.readTabledataPublish("1", "3").then((tabData) => {
      const tabValue = tabData;
      expect(tabValue).to.be.equal("Lindsay Ferguson");
      cy.log("the value is" + tabValue);
    });
  });

  it("Table Widget Functionality To Show a Base64 Image", function() {
    cy.openPropertyPane("tablewidget");
    cy.editColumn("image");
    cy.changeColumnType("Image");
    cy.isSelectRow(1);

    const index = 1;
    const imageVal = this.data.TableInput[index].image;
    cy.readTableLinkPublish(index, "1").then((hrefVal) => {
      expect(hrefVal).to.contain(imageVal);
    });
  });

  it("Table Widget Functionality To Filter The Data", function() {
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(1000);
    cy.isSelectRow(1);
    cy.readTabledataPublish("1", "3").then((tabData) => {
      const tabValue = tabData;
      expect(tabValue).to.be.equal("Lindsay Ferguson");
      cy.log("the value is" + tabValue);
      cy.get(publish.filterBtn).click({ force: true });
      cy.get(publish.attributeDropdown).click({ force: true });
      cy.get(publish.attributeValue)
        .contains("userName")
        .click({ force: true });
      cy.get(publish.conditionDropdown).click({ force: true });
      cy.get(publish.attributeValue)
        .contains("is exactly")
        .click({ force: true });
      cy.get(publish.inputValue).type(tabValue);
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(500);
      cy.get(widgetsPage.filterApplyBtn).click({ force: true });
      cy.wait(500);
      // cy.get(widgetsPage.filterCloseBtn).click({force:true});
      cy.readTabledataPublish("0", "3").then((tabData) => {
        const tabValue = tabData;
        expect(tabValue).to.be.equal("Lindsay Ferguson");
      });
      cy.get(widgetsPage.filterCloseBtn).click({ force: true });
      cy.get(publish.filterBtn).click({ force: true });
      cy.get(publish.removeFilter).click({ force: true });
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(500);
      cy.readTabledataPublish("0", "3").then((tabData) => {
        const tabValue = tabData;
        expect(tabValue).to.be.equal("Michael Lawson");
      });
      cy.get(publish.canvas)
        .first()
        .click({ force: true });
      cy.wait(500);
    });
  });

  it("Table Widget Functionality To Filter The Data using contains", function() {
    cy.isSelectRow(1);
    cy.readTabledataPublish("1", "3").then((tabData) => {
      const tabValue = tabData;
      expect(tabValue).to.be.equal("Lindsay Ferguson");
      cy.log("the value is" + tabValue);
      cy.get(publish.filterBtn).click({ force: true });
      cy.get(publish.attributeDropdown).click({ force: true });
      cy.get(publish.attributeValue)
        .contains("userName")
        .click({ force: true });
      cy.get(publish.conditionDropdown).click({ force: true });
      cy.get(publish.attributeValue)
        .contains("contains")
        .click({ force: true });
      cy.get(publish.inputValue).type("Lindsay");
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(500);
      cy.get(widgetsPage.filterApplyBtn).click({ force: true });
      cy.wait(500);
      cy.readTabledataPublish("0", "3").then((tabData) => {
        const tabValue = tabData;
        expect(tabValue).to.be.equal("Lindsay Ferguson");
      });
      cy.get(widgetsPage.filterCloseBtn).click({ force: true });
      cy.get(publish.filterBtn).click({ force: true });
      cy.get(publish.removeFilter).click({ force: true });
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

  it("Table Widget Functionality To Filter The Data using starts with ", function() {
    cy.isSelectRow(1);
    cy.readTabledataPublish("1", "3").then((tabData) => {
      const tabValue = tabData;
      expect(tabValue).to.be.equal("Lindsay Ferguson");
      cy.log("the value is" + tabValue);
      cy.get(publish.filterBtn).click({ force: true });
      cy.get(publish.attributeDropdown).click({ force: true });
      cy.get(publish.attributeValue)
        .contains("userName")
        .click({ force: true });
      cy.get(publish.conditionDropdown).click({ force: true });
      cy.get(publish.attributeValue)
        .contains("starts with")
        .click({ force: true });
      cy.get(publish.inputValue).type("Lindsay");
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(500);
      cy.get(widgetsPage.filterApplyBtn).click({ force: true });
      cy.wait(500);
      cy.readTabledataPublish("0", "3").then((tabData) => {
        const tabValue = tabData;
        expect(tabValue).to.be.equal("Lindsay Ferguson");
      });
      cy.get(widgetsPage.filterCloseBtn).click({ force: true });
      cy.get(publish.filterBtn).click({ force: true });
      cy.get(publish.removeFilter).click({ force: true });
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

  it("Table Widget Functionality To Filter The Data using ends with ", function() {
    cy.isSelectRow(1);
    cy.readTabledataPublish("1", "3").then((tabData) => {
      const tabValue = tabData;
      expect(tabValue).to.be.equal("Lindsay Ferguson");
      cy.log("the value is" + tabValue);
      cy.get(publish.filterBtn).click({ force: true });
      cy.get(publish.attributeDropdown).click({ force: true });
      cy.get(publish.attributeValue)
        .contains("userName")
        .click({ force: true });
      cy.get(publish.conditionDropdown).click({ force: true });
      cy.get(publish.attributeValue)
        .contains("ends with")
        .click({ force: true });
      cy.get(publish.inputValue).type("Ferguson");
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(500);
      cy.get(widgetsPage.filterApplyBtn).click({ force: true });
      cy.wait(500);
      cy.readTabledataPublish("0", "3").then((tabData) => {
        const tabValue = tabData;
        expect(tabValue).to.be.equal("Lindsay Ferguson");
      });
      cy.get(widgetsPage.filterCloseBtn).click({ force: true });
      cy.get(publish.filterBtn).click({ force: true });
      cy.get(publish.removeFilter).click({ force: true });
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

  it("Table Widget Functionality To Search The Data", function() {
    cy.isSelectRow(1);
    cy.readTabledataPublish("1", "3").then((tabData) => {
      const tabValue = tabData;
      expect(tabValue).to.be.equal("Lindsay Ferguson");
      cy.log("the value is" + tabValue);
      cy.get(publish.searchInput)
        .first()
        .type(tabData);
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(500);
      cy.readTabledataPublish("1", "3").then((tabData) => {
        const tabValue = tabData;
        expect(tabValue).to.be.equal("Lindsay Ferguson");
      });
      cy.get(publish.downloadBtn).click({ force: true });
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(5000);
      cy.get(publish.searchInput)
        .first()
        .within(() => {
          return cy.get("input").clear();
        })
        .type("7434532");
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(1000);
      cy.readTabledataPublish("3", "3").then((tabData) => {
        const tabValue = tabData;
        expect(tabValue).to.be.equal("Byron Fields");
      });
    });
  });

  it("Table Widget Functionality To Check if Table is Sortable", function() {
    cy.openPropertyPane("tablewidget");
    // Confirm if isSortable is true
    cy.get(commonlocators.isSortable).should("be.checked");
    // Publish App
    cy.PublishtheApp();
    // Confirm Current order
    cy.readTabledataPublish("1", "3").then((tabData) => {
      const tabValue = tabData;
      expect(tabValue).to.be.equal("Lindsay Ferguson");
    });
    cy.readTabledataPublish("0", "3").then((tabData) => {
      const tabValue = tabData;
      expect(tabValue).to.be.equal("Michael Lawson");
    });
    // Sort Username Column
    cy.contains('[role="columnheader"]', "userName")
      .first()
      .click({
        force: true,
      });
    cy.wait(1000);
    // Confirm order after sort
    cy.readTabledataPublish("1", "3").then((tabData) => {
      const tabValue = tabData;
      expect(tabValue).to.be.equal("Ryan Holmes");
    });
    cy.readTabledataPublish("0", "3").then((tabData) => {
      const tabValue = tabData;
      expect(tabValue).to.be.equal("Tobias Funke");
    });
    // Back to edit page
    cy.get(publish.backToEditor).click({
      force: true,
    });

    cy.openPropertyPane("tablewidget");
    // Disable isSortable
    // Confirm if isSortable is false
    cy.togglebarDisable(commonlocators.isSortable);

    // Publish App
    cy.PublishtheApp();
    // Confirm Current order
    cy.readTabledataPublish("1", "3").then((tabData) => {
      const tabValue = tabData;
      expect(tabValue).to.be.equal("Lindsay Ferguson");
    });
    cy.readTabledataPublish("0", "3").then((tabData) => {
      const tabValue = tabData;
      expect(tabValue).to.be.equal("Michael Lawson");
    });
    // Confirm Sort is disable on Username Column
    cy.contains('[role="columnheader"]', "userName")
      .first()
      .click({
        force: true,
      });
    cy.wait(1000);
    // Confirm order after sort
    cy.readTabledataPublish("1", "3").then((tabData) => {
      const tabValue = tabData;
      expect(tabValue).not.to.be.equal("Ryan Holmes");
    });
    cy.readTabledataPublish("0", "3").then((tabData) => {
      const tabValue = tabData;
      expect(tabValue).not.to.be.equal("Tobias Funke");
    });
  });

  /*
  To enabled later

  it("Table Widget Functionality To Verify The Visiblity mode functionality", function() {
    cy.get(publish.backToEditor)
      .first()
      .click();
    cy.isSelectRow(1);
    cy.readTabledataPublish("1", "3").then(tabData => {
      const tabValue = tabData;
      expect(tabValue).to.be.equal("Lindsay Ferguson");
      cy.log("the value is" + tabValue);
      cy.get(publish.visibilityMode).click();
      cy.get(publish.visibilityOpt)
        .contains("userName")
        .click();
      cy.get(publish.containerWidget).click();
      cy.readTabledataPublish("1", "3").then(tabData => {
        const tabValue = tabData;
        expect(tabValue).to.not.equal("Lindsay Ferguson");
      });
      cy.get(publish.visibilityMode).click();
      cy.get(publish.visibilityOpt)
        .contains("userName")
        .click();
      cy.get(publish.containerWidget).click();
      cy.readTabledataPublish("1", "3").then(tabData => {
        const tabValue = tabData;
        expect(tabValue).to.be.equal("Lindsay Ferguson");
      });
    });
  });
*/

  afterEach(() => {
    // put your clean up code if any
  });
});
