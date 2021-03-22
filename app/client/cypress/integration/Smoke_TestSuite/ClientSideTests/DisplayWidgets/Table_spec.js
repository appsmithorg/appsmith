/* eslint-disable cypress/no-unnecessary-waiting */
const widgetsPage = require("../../../../locators/Widgets.json");
const commonlocators = require("../../../../locators/commonlocators.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const dsl = require("../../../../fixtures/tableWidgetDsl.json");
const pages = require("../../../../locators/Pages.json");

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
    //   .contains("Navigate To")
    //   .click();
    // cy.wait("@updateLayout");
    // cy.get(widgetsPage.tableOnRowSelected)
    //   .get(commonlocators.dropdownSelectButton)
    //   .first()
    //   .find("> .bp3-button-text")
    //   .should("have.text", "{{navigateTo()}}");
    cy.get(commonlocators.editPropCrossButton).click();
    cy.PublishtheApp();
  });

  it("Table Widget Functionality To Verify The Data", function() {
    cy.isSelectRow(1);
    cy.readTabledataPublish("1", "3").then((tabData) => {
      const tabValue = tabData;
      expect(tabValue).to.be.equal("Lindsay Ferguson");
      cy.log("the value is" + tabValue);
    });
  });

  it("Table Widget Functionality To Show a Base64 Image", function() {
    cy.get(publish.backToEditor).click();
    cy.openPropertyPane("tablewidget");
    cy.editColumn("image");
    cy.changeColumnType("Image");
    cy.isSelectRow(1);

    const index = 1;
    const imageVal = this.data.TableInput[index].image;
    cy.readTableLinkPublish(index, "1").then((hrefVal) => {
      expect(hrefVal).to.be.equal(imageVal);
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
      cy.wait(500);
      cy.readTabledataPublish("1", "3").then((tabData) => {
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
      cy.readTabledataPublish("3", "3").then((tabData) => {
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
        .contains("is exactly")
        .click();
      cy.get(publish.inputValue).type(tabValue);
      cy.wait(500);
      cy.get(publish.canvas)
        .first()
        .click();
      cy.readTabledataPublish("0", "3").then((tabData) => {
        const tabValue = tabData;
        expect(tabValue).to.be.equal("Lindsay Ferguson");
      });
      cy.get(publish.filterBtn).click();
      cy.get(publish.removeFilter).click();
      cy.wait(500);
      cy.readTabledataPublish("0", "3").then((tabData) => {
        const tabValue = tabData;
        expect(tabValue).to.be.equal("Michael Lawson");
      });
      cy.get(publish.canvas)
        .first()
        .click();
    });
  });

  it("Table Widget Functionality To Filter The Data using contains", function() {
    cy.isSelectRow(1);
    cy.readTabledataPublish("1", "3").then((tabData) => {
      const tabValue = tabData;
      expect(tabValue).to.be.equal("Lindsay Ferguson");
      cy.log("the value is" + tabValue);
      cy.get(publish.filterBtn).click();
      cy.get(publish.attributeDropdown).click();
      cy.get(publish.attributeValue)
        .contains("userName")
        .click();
      cy.get(publish.conditionDropdown).click();
      cy.get(publish.attributeValue)
        .contains("contains")
        .click();
      cy.get(publish.inputValue).type("Lindsay");
      cy.wait(500);
      cy.get(publish.canvas)
        .first()
        .click();
      cy.readTabledataPublish("0", "3").then((tabData) => {
        const tabValue = tabData;
        expect(tabValue).to.be.equal("Lindsay Ferguson");
      });
      cy.get(publish.filterBtn).click();
      cy.get(publish.removeFilter).click();
      cy.wait(500);
      cy.readTabledataPublish("0", "3").then((tabData) => {
        const tabValue = tabData;
        expect(tabValue).to.be.equal("Michael Lawson");
      });
      cy.get(publish.canvas)
        .first()
        .click();
    });
  });

  it("Table Widget Functionality To Filter The Data using starts with ", function() {
    cy.isSelectRow(1);
    cy.readTabledataPublish("1", "3").then((tabData) => {
      const tabValue = tabData;
      expect(tabValue).to.be.equal("Lindsay Ferguson");
      cy.log("the value is" + tabValue);
      cy.get(publish.filterBtn).click();
      cy.get(publish.attributeDropdown).click();
      cy.get(publish.attributeValue)
        .contains("userName")
        .click();
      cy.get(publish.conditionDropdown).click();
      cy.get(publish.attributeValue)
        .contains("starts with")
        .click();
      cy.get(publish.inputValue).type("Lindsay");
      cy.wait(500);
      cy.get(publish.canvas)
        .first()
        .click();
      cy.readTabledataPublish("0", "3").then((tabData) => {
        const tabValue = tabData;
        expect(tabValue).to.be.equal("Lindsay Ferguson");
      });
      cy.get(publish.filterBtn).click();
      cy.get(publish.removeFilter).click();
      cy.wait(500);
      cy.readTabledataPublish("0", "3").then((tabData) => {
        const tabValue = tabData;
        expect(tabValue).to.be.equal("Michael Lawson");
      });
      cy.get(publish.canvas)
        .first()
        .click();
    });
  });

  it("Table Widget Functionality To Filter The Data using ends with ", function() {
    cy.isSelectRow(1);
    cy.readTabledataPublish("1", "3").then((tabData) => {
      const tabValue = tabData;
      expect(tabValue).to.be.equal("Lindsay Ferguson");
      cy.log("the value is" + tabValue);
      cy.get(publish.filterBtn).click();
      cy.get(publish.attributeDropdown).click();
      cy.get(publish.attributeValue)
        .contains("userName")
        .click();
      cy.get(publish.conditionDropdown).click();
      cy.get(publish.attributeValue)
        .contains("ends with")
        .click();
      cy.get(publish.inputValue).type("Ferguson");
      cy.wait(500);
      cy.get(publish.canvas)
        .first()
        .click();
      cy.readTabledataPublish("0", "3").then((tabData) => {
        const tabValue = tabData;
        expect(tabValue).to.be.equal("Lindsay Ferguson");
      });
      cy.get(publish.filterBtn).click();
      cy.get(publish.removeFilter).click();
      cy.wait(500);
      cy.readTabledataPublish("0", "3").then((tabData) => {
        const tabValue = tabData;
        expect(tabValue).to.be.equal("Michael Lawson");
      });
      cy.get(publish.canvas)
        .first()
        .click();
    });
  });

  it("Table Widget Functionality To Check Compact Mode", function() {
    cy.isSelectRow(1);
    cy.readTabledataPublish("1", "3").then((tabData) => {
      const tabValue = tabData;
      expect(tabValue).to.be.equal("Lindsay Ferguson");
      cy.log("the value is" + tabValue);
      cy.get(publish.compactMode).click();
      cy.get(publish.compactOpt)
        .contains("Tall")
        .click();
      cy.scrollTabledataPublish("3", "3").then((tabData) => {
        const tabValue = tabData;
        expect(tabValue).to.be.equal("Byron Fields");
      });
      cy.get(publish.compactMode).click();
      cy.get(publish.compactOpt)
        .contains("Short")
        .click();
      cy.readTabledataPublish("4", "3").then((tabData) => {
        const tabValue = tabData;
        expect(tabValue).to.be.equal("Ryan Holmes");
      });
    });
  });

  it("Check Selected Row(s) Resets When Table Data Changes", function() {
    cy.isSelectRow(1);
    cy.openPropertyPane("tablewidget");

    const newTableData = [...this.data.TableInput];
    newTableData[0].userName = "";
    cy.testJsontext("tabledata", JSON.stringify(newTableData));
    cy.wait("@updateLayout");
    const selectedRowsSelector = `.t--widget-tablewidget .tbody .tr.selected-row`;
    cy.get(selectedRowsSelector).should(($p) => {
      // should found 0 rows
      expect($p).to.have.length(0);
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
