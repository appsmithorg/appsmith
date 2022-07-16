/* eslint-disable cypress/no-unnecessary-waiting */
const widgetsPage = require("../../../../../locators/Widgets.json");
const commonlocators = require("../../../../../locators/commonlocators.json");
const publish = require("../../../../../locators/publishWidgetspage.json");
const dsl = require("../../../../../fixtures/tableV2WidgetDsl.json");

describe("Table Widget V2 Functionality", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("1. Table Widget V2 Functionality", function() {
    cy.openPropertyPane("tablewidgetv2");

    /**
     * @param{Text} Random Text
     * @param{ChartWidget}Mouseover
     * @param{ChartPre Css} Assertion
     */
    cy.widgetText(
      "Table1",
      widgetsPage.tableWidgetV2,
      commonlocators.tableV2Inner,
    );
    cy.testJsontext("tabledata", JSON.stringify(this.data.TableInput));
    cy.wait("@updateLayout");
  });

  it("2. Table Widget V2 Functionality To Verify The Data", function() {
    cy.readTableV2dataPublish("1", "3").then((tabData) => {
      const tabValue = tabData;
      expect(tabValue).to.be.equal("Lindsay Ferguson");
      cy.log("the value is" + tabValue);
    });
  });

  it("3. Table Widget V2 Functionality To Show a Base64 Image", function() {
    cy.openPropertyPane("tablewidgetv2");
    cy.editColumn("image");
    cy.changeColumnType("Image");
    cy.isSelectRow(1);

    const index = 1;
    const imageVal = this.data.TableInput[index].image;
    cy.readTableV2LinkPublish(index, "1").then((hrefVal) => {
      expect(hrefVal).to.contain(imageVal);
    });
  });

  it("4. Table Widget V2 Functionality To Check if Table is Sortable", function() {
    cy.get(commonlocators.editPropBackButton).click();
    cy.openPropertyPane("tablewidgetv2");
    // Confirm if isSortable is true
    cy.get(commonlocators.isSortable).should("be.checked");
    // Publish App
    cy.PublishtheApp();
    // Confirm Current order
    cy.readTableV2dataPublish("1", "3").then((tabData) => {
      const tabValue = tabData;
      expect(tabValue).to.be.equal("Lindsay Ferguson");
    });
    cy.readTableV2dataPublish("0", "3").then((tabData) => {
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
    cy.readTableV2dataPublish("1", "3").then((tabData) => {
      const tabValue = tabData;
      expect(tabValue).to.be.equal("Ryan Holmes");
    });
    cy.readTableV2dataPublish("0", "3").then((tabData) => {
      const tabValue = tabData;
      expect(tabValue).to.be.equal("Tobias Funke");
    });
    // Back to edit page
    cy.get(publish.backToEditor).click({
      force: true,
    });

    cy.openPropertyPane("tablewidgetv2");
    // Disable isSortable
    // Confirm if isSortable is false
    cy.togglebarDisable(commonlocators.isSortable);

    // Publish App
    cy.PublishtheApp();
    // Confirm Current order
    cy.readTableV2dataPublish("1", "3").then((tabData) => {
      const tabValue = tabData;
      expect(tabValue).to.be.equal("Lindsay Ferguson");
    });
    cy.readTableV2dataPublish("0", "3").then((tabData) => {
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
    cy.readTableV2dataPublish("1", "3").then((tabData) => {
      const tabValue = tabData;
      expect(tabValue).not.to.be.equal("Ryan Holmes");
    });
    cy.readTableV2dataPublish("0", "3").then((tabData) => {
      const tabValue = tabData;
      expect(tabValue).not.to.be.equal("Tobias Funke");
    });
  });
});
