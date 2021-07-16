/* eslint-disable cypress/no-unnecessary-waiting */
const widgetsPage = require("../../../../locators/Widgets.json");
const commonlocators = require("../../../../locators/commonlocators.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const dsl = require("../../../../fixtures/tableWidgetDsl.json");

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
    // Changing the name of the widget
    cy.widgetText("Table1", widgetsPage.tableWidget, commonlocators.tableInner);
    // Entering the data in the table from property pane
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
    // Closing Property pane
    cy.get(commonlocators.editPropCrossButton).click({ force: true });
    cy.PublishtheApp();
  });

  it("Table Widget Functionality To Verify The Data", function() {
    cy.isSelectRow(1);
    // Reading single cell value of the table and verify it's value.
    cy.readTabledataPublish("1", "3").then((tabData) => {
      const tabValue = tabData;
      expect(tabValue).to.be.equal("Lindsay Ferguson");
      cy.log("the value is" + tabValue);
    });
    cy.get(publish.backToEditor).click();
  });

  /*it("Verify Column Sequnce Changing property", function() {
    cy.reArrangeColumn({ x: 200, y: 20 });
    cy.wait(2000);
  });*/

  it("Table Widget Functionality To Verify Row Height Functionality", function() {
    //click on Row Height Toggle
    cy.get(widgetsPage.rowHeight).click({ force: true });
    // Select short row height
    cy.get(widgetsPage.rowHeightShortOpt).click({ force: true });
    cy.PublishtheApp();
    // Verify the row height is short
    cy.get(widgetsPage.tbIndex0).should("have.css", "height", "20px");
    cy.get(publish.backToEditor).click();
  });

  it("Table Widget Functionality To Drage and Drop Table widget and verify default data", function() {
    // Click on Add widget button
    cy.get(widgetsPage.addWidget).click();
    // Drag and drop table widget
    cy.dragAndDropToCanvas("tablewidget", { x: 300, y: 500 });
    cy.wait(2000);
    // Close widget bar
    cy.get(widgetsPage.closeWidgetBar).click({ force: true });
    cy.closePropertyPane();
    // Open property pane
    cy.SearchEntityandOpen("Table1");
    cy.get(widgetsPage.visible).click({ force: true });
    cy.PublishtheApp();
    // Reading single cell value of the table and verify value is not empty.
    cy.readTabledataPublish("1", "1").then((tabData) => {
      const tabValue = tabData;
      expect(tabValue).to.not.be.equal("");
      cy.log("the value is" + tabValue);
    });
    cy.get(publish.backToEditor).click();
    cy.SearchEntityandOpen("Table2");
    // Delete Table2
    cy.deleteWidget(widgetsPage.tableWidget);
    cy.wait(2000);
  });

  it("Table Widget Functionality To Show a Base64 Image", function() {
    cy.openPropertyPane("tablewidget");
    // Adding Base64 images to all the columns
    cy.editColumn("image");
    cy.changeColumnType("Image");
    cy.isSelectRow(1);

    const index = 1;
    const imageVal = this.data.TableInput[index].image;
    // Verifying the href of the image added.
    cy.readTableLinkPublish(index, "1").then((hrefVal) => {
      expect(hrefVal).to.be.contains(imageVal);
    });
  });

  it("Table Widget Functionality To Search The Data", function() {
    cy.isSelectRow(1);
    // Reading single cell value of the table and verify it's value.
    cy.readTabledataPublish("1", "3").then((tabData) => {
      const tabValue = tabData;
      expect(tabValue).to.be.equal("Lindsay Ferguson");
      cy.log("the value is" + tabValue);
      // Search for the above value in the table
      cy.get(publish.searchInput)
        .first()
        .type(tabData);
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(500);
      // Reading searched cell value of the table and verify it's value.
      cy.readTabledataPublish("1", "3").then((tabData) => {
        const tabValue = tabData;
        expect(tabValue).to.be.equal("Lindsay Ferguson");
      });
      // Click on the download button to clear the focus in search field.
      cy.get(publish.downloadBtn).click();
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(5000);
      // Again Search for the specific value in the table
      cy.get(publish.searchInput)
        .first()
        .within(() => {
          return cy.get("input").clear();
        })
        .type("7434532");
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(1000);
      // Reading searched cell value of the table and verify it's value.
      cy.readTabledataPublish("3", "3").then((tabData) => {
        const tabValue = tabData;
        expect(tabValue).to.be.equal("Byron Fields");
      });
    });
  });

  it("Table Widget Functionality To Filter The Data using 'is exactly'", function() {
    // Clear the search field.
    cy.get(publish.searchInput)
      .first()
      .within(() => {
        return cy.get("input").clear();
      });
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(1000);
    cy.isSelectRow(1);
    // Reading single cell value of the table and verify it's value.
    cy.readTabledataPublish("1", "3").then((tabData) => {
      const tabValue = tabData;
      expect(tabValue).to.be.equal("Lindsay Ferguson");
      cy.log("the value is" + tabValue);
      // Filter the table by "userName" column/attribute
      cy.get(publish.filterBtn).click();
      cy.get(publish.attributeDropdown).click();
      cy.get(publish.attributeValue)
        .contains("userName")
        .click();
      // Select filter condition: "is exactly"
      cy.get(publish.conditionDropdown).click();
      cy.get(publish.attributeValue)
        .contains("is exactly")
        .click();
      // Entering the expected value to be compared.
      cy.get(publish.inputValue).type(tabValue);
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(500);
      // Clear the focus on filter
      cy.get(publish.canvas)
        .first()
        .click();
      // Reading single cell value of the filtered table and verify it's value
      cy.readTabledataPublish("0", "3").then((tabData) => {
        const tabValue = tabData;
        expect(tabValue).to.be.equal("Lindsay Ferguson");
      });
      // Removing the filter
      cy.get(publish.filterBtn).click();
      cy.get(publish.removeFilter).click();
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(500);
      // Reading single cell value of the table and verify it's value after removing the filter
      cy.readTabledataPublish("0", "3").then((tabData) => {
        const tabValue = tabData;
        expect(tabValue).to.be.equal("Michael Lawson");
      });
      // Clear the focus
      cy.get(publish.canvas)
        .first()
        .click();
    });
  });

  it("Table Widget Functionality To Filter The Data using 'contains'", function() {
    cy.isSelectRow(1);
    // Reading single cell value of the table and verify it's value.
    cy.readTabledataPublish("1", "3").then((tabData) => {
      const tabValue = tabData;
      expect(tabValue).to.be.equal("Lindsay Ferguson");
      cy.log("the value is" + tabValue);
      // Filter the table by "userName" column/attribute
      cy.get(publish.filterBtn).click();
      cy.get(publish.attributeDropdown).click();
      cy.get(publish.attributeValue)
        .contains("userName")
        .click();
      // Select filter condition: "contains"
      cy.get(publish.conditionDropdown).click();
      cy.get(publish.attributeValue)
        .contains("contains")
        .click();
      // Entering the expected value to be compared.
      cy.get(publish.inputValue).type("Lindsay");
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(500);
      // Clear the focus on filter
      cy.get(publish.canvas)
        .first()
        .click();
      // Reading single cell value of the filtered table and verify it's value
      cy.readTabledataPublish("0", "3").then((tabData) => {
        const tabValue = tabData;
        expect(tabValue).to.be.equal("Lindsay Ferguson");
      });
      // Removing the filter
      cy.get(publish.filterBtn).click();
      cy.get(publish.removeFilter).click();
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(500);
      // Reading single cell value of the table and verify it's value after removing the filter
      cy.readTabledataPublish("0", "3").then((tabData) => {
        const tabValue = tabData;
        expect(tabValue).to.be.equal("Michael Lawson");
      });
      // Clear the focus
      cy.get(publish.canvas)
        .first()
        .click();
    });
  });

  /* it("Table Widget Functionality To Filter The Data using 'does not contain'", function() {
    cy.isSelectRow(1);
    // Reading single cell value of the table and verify it's value.
    cy.readTabledataPublish("1", "3").then((tabData) => {
      const tabValue = tabData;
      expect(tabValue).to.be.equal("Lindsay Ferguson");
      cy.log("the value is" + tabValue);
      // Filter the table by "userName" column/attribute
      cy.get(publish.filterBtn).click();
      cy.get(publish.attributeDropdown).click();
      cy.get(publish.attributeValue)
        .contains("userName")
        .click();
      // Select filter condition: "contains"
      cy.get(publish.conditionDropdown).click();
      cy.get(publish.attributeValue)
        .contains("does not contain")
        .click();
      // Entering the expected value to be compared.
      cy.get(publish.inputValue).type("Lindsay");
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(500);
      // Clear the focus on filter
      cy.get(publish.canvas)
        .first()
        .click();
      // Reading single cell value of the filtered table and verify it's value
      cy.readTabledataPublish("0", "0").then((tabData) => {
        const tabValue = tabData;
        expect(tabValue).to.not.be.equal("Lindsay Ferguson");
        cy.log(tabData);
      });
      // Removing the filter
      cy.get(publish.filterBtn).click();
      cy.get(publish.removeFilter).click();
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(500);
      // Reading single cell value of the table and verify it's value after removing the filter
      cy.readTabledataPublish("0", "3").then((tabData) => {
        const tabValue = tabData;
        expect(tabValue).to.be.equal("Michael Lawson");
      });
      // Clear the focus
      cy.get(publish.canvas)
        .first()
        .click();
    });
  });*/

  it("Table Widget Functionality To Filter The Data using starts with ", function() {
    cy.isSelectRow(1);
    // Reading single cell value of the table and verify it's value.
    cy.readTabledataPublish("1", "3").then((tabData) => {
      const tabValue = tabData;
      expect(tabValue).to.be.equal("Lindsay Ferguson");
      cy.log("the value is" + tabValue);
      // Filter the table by "userName" column/attribute
      cy.get(publish.filterBtn).click();
      cy.get(publish.attributeDropdown).click();
      cy.get(publish.attributeValue)
        .contains("userName")
        .click();
      // Select filter condition: "starts with"
      cy.get(publish.conditionDropdown).click();
      cy.get(publish.attributeValue)
        .contains("starts with")
        .click();
      // Entering the expected value to be compared.
      cy.get(publish.inputValue).type("Lindsay");
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(500);
      // Clear the focus on filter
      cy.get(publish.canvas)
        .first()
        .click();
      // Reading single cell value of the filtered table and verify it's value
      cy.readTabledataPublish("0", "3").then((tabData) => {
        const tabValue = tabData;
        expect(tabValue).to.be.equal("Lindsay Ferguson");
      });
      // Reading single cell value of the table and verify it's value after removing the filter
      cy.get(publish.filterBtn).click();
      cy.get(publish.removeFilter).click();
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(500);
      cy.readTabledataPublish("0", "3").then((tabData) => {
        const tabValue = tabData;
        expect(tabValue).to.be.equal("Michael Lawson");
      });
      // Clear the focus on filter
      cy.get(publish.canvas)
        .first()
        .click();
    });
  });

  it("Table Widget Functionality To Filter The Data using ends with ", function() {
    cy.isSelectRow(1);
    // Reading single cell value of the table and verify it's value.
    cy.readTabledataPublish("1", "3").then((tabData) => {
      const tabValue = tabData;
      expect(tabValue).to.be.equal("Lindsay Ferguson");
      cy.log("the value is" + tabValue);
      // Filter the table by "userName" column/attribute
      cy.get(publish.filterBtn).click();
      cy.get(publish.attributeDropdown).click();
      cy.get(publish.attributeValue)
        .contains("userName")
        .click();
      // Select filter condition: "ends with"
      cy.get(publish.conditionDropdown).click();
      cy.get(publish.attributeValue)
        .contains("ends with")
        .click();
      // Entering the expected value to be compared.
      cy.get(publish.inputValue).type("Ferguson");
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(500);
      // Clear the focus on filter
      cy.get(publish.canvas)
        .first()
        .click();
      // Reading single cell value of the filtered table and verify it's value
      cy.readTabledataPublish("0", "3").then((tabData) => {
        const tabValue = tabData;
        expect(tabValue).to.be.equal("Lindsay Ferguson");
      });
      // Reading single cell value of the table and verify it's value after removing the filter
      cy.get(publish.filterBtn).click();
      cy.get(publish.removeFilter).click();
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(500);
      cy.readTabledataPublish("0", "3").then((tabData) => {
        const tabValue = tabData;
        expect(tabValue).to.be.equal("Michael Lawson");
      });
      // Clear the focus on filter
      cy.get(publish.canvas)
        .first()
        .click();
    });
  });

  it("Table Widget Functionality To Filter The Data using 'Empty'", function() {
    cy.isSelectRow(1);
    // Reading single cell value of the table and verify it's value.
    cy.readTabledataPublish("1", "3").then((tabData) => {
      const tabValue = tabData;
      expect(tabValue).to.be.equal("Lindsay Ferguson");
      cy.log("the value is" + tabValue);
      // Filter the table by "userName" column/attribute
      cy.get(publish.filterBtn).click();
      cy.get(publish.attributeDropdown).click();
      cy.get(publish.attributeValue)
        .contains("userName")
        .click();
      // Select filter condition: "starts with"
      cy.get(publish.conditionDropdown).click();
      cy.get(publish.attributeValue)
        .contains("empty")
        .click();

      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(500);
      // Clear the focus on filter
      cy.get(publish.canvas)
        .first()
        .click();
      // Reading single cell value of the table and verify it's empty
      cy.get(
        ".t--widget-tablewidget .tbody .td[data-rowindex=0][data-colindex=0] div",
      ).should("not.exist");
      cy.log("the value is" + tabValue);
      // Reading single cell value of the table and verify it's value after removing the filter
      cy.get(publish.filterBtn).click();
      cy.get(publish.removeFilter).click();
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(500);
      cy.readTabledataPublish("0", "3").then((tabData) => {
        const tabValue = tabData;
        expect(tabValue).to.be.equal("Michael Lawson");
      });
      // Clear the focus on filter
      cy.get(publish.canvas)
        .first()
        .click();
    });
  });

  it("Table Widget Functionality To Filter The Data using 'Not Empty'", function() {
    cy.isSelectRow(1);
    // Reading single cell value of the table and verify it's value.
    cy.readTabledataPublish("1", "3").then((tabData) => {
      const tabValue = tabData;
      expect(tabValue).to.be.equal("Lindsay Ferguson");
      cy.log("the value is" + tabValue);
      // Filter the table by "userName" column/attribute
      cy.get(publish.filterBtn).click();
      cy.get(publish.attributeDropdown).click();
      cy.get(publish.attributeValue)
        .contains("userName")
        .click();
      // Select filter condition: "starts with"
      cy.get(publish.conditionDropdown).click();
      cy.get(publish.attributeValue)
        .contains("not empty")
        .click();

      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(500);
      // Clear the focus on filter
      cy.get(publish.canvas)
        .first()
        .click();
      // Reading single cell value of the table and verify it's empty
      cy.readTabledataPublish("1", "1").then((tabData) => {
        const tabValue = tabData;
        expect(tabValue).to.be.equal("");
        cy.log("the value is" + tabValue);
      });
      // Reading single cell value of the table and verify it's value after removing the filter
      cy.get(publish.filterBtn).click();
      cy.get(publish.removeFilter).click();
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(500);
      cy.readTabledataPublish("0", "3").then((tabData) => {
        const tabValue = tabData;
        expect(tabValue).to.be.equal("Michael Lawson");
      });
      // Clear the focus on filter
      cy.get(publish.canvas)
        .first()
        .click();
    });
  });

  it("Table Widget Functionality To Check Compact Mode", function() {
    cy.isSelectRow(1);
    // Reading single cell value of the table and verify it's value.
    cy.readTabledataPublish("1", "3").then((tabData) => {
      const tabValue = tabData;
      expect(tabValue).to.be.equal("Lindsay Ferguson");
      cy.log("the value is" + tabValue);
      cy.get(publish.rowHeight).click();
      cy.get(publish.rowHeightOpt)
        .contains("Tall")
        .click();
      // After scrolling Reading single cell value of the table and verify it's value.
      cy.scrollTabledataPublish("3", "3").then((tabData) => {
        const tabValue = tabData;
        expect(tabValue).to.be.equal("Byron Fields");
      });
      cy.get(publish.rowHeight).click();
      cy.get(publish.rowHeightOpt)
        .contains("Short")
        .click();
      // Reading single cell value of the table and verify it's value.
      cy.readTabledataPublish("4", "3").then((tabData) => {
        const tabValue = tabData;
        expect(tabValue).to.be.equal("Ryan Holmes");
      });
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
