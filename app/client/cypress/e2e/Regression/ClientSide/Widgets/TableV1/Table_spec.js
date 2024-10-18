/* eslint-disable cypress/no-unnecessary-waiting */
const widgetsPage = require("../../../../../locators/Widgets.json");
const commonlocators = require("../../../../../locators/commonlocators.json");
import * as _ from "../../../../../support/Objects/ObjectsCore";

describe(
  "Table Widget Functionality",
  { tags: ["@tag.Widget", "@tag.Table", "@tag.Binding"] },
  function () {
    before(() => {
      _.agHelper.AddDsl("tableWidgetDsl");
    });

    it("Table Widget Functionality", function () {
      cy.openPropertyPane("tablewidget");

      /**
       * @param{Text} Random Text
       * @param{ChartWidget}Mouseover
       * @param{ChartPre Css} Assertion
       */
      cy.widgetText(
        "Table1",
        widgetsPage.tableWidget,
        widgetsPage.widgetNameSpan,
      );
      cy.testJsontext("tabledata", JSON.stringify(this.dataSet.TableInput));
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

    it("Table Widget Functionality To Verify The Data", function () {
      cy.readTabledataPublish("1", "3").then((tabData) => {
        const tabValue = tabData;
        expect(tabValue).to.be.equal("Lindsay Ferguson");
        cy.log("the value is" + tabValue);
      });
    });

    it("Table Widget Functionality To Show a Base64 Image", function () {
      cy.openPropertyPane("tablewidget");
      cy.editColumn("image");
      cy.changeColumnType("Image", false);
      _.table.SelectTableRow(1);

      const index = 1;
      const imageVal = this.dataSet.TableInput[index].image;
      cy.readTableLinkPublish(index, "1").then((hrefVal) => {
        expect(hrefVal).to.contain(imageVal);
      });
    });

    it("Table Widget Functionality To Check if Table is Sortable", function () {
      cy.get(commonlocators.editPropBackButton).click();
      cy.openPropertyPane("tablewidget");
      // Confirm if isSortable is true
      cy.get(commonlocators.isSortable_tablev1).should("be.checked");
      // Publish App
      _.deployMode.DeployApp();
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
      cy.contains('[role="columnheader"]', "userName").first().click({
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
      _.deployMode.NavigateBacktoEditor();

      cy.openPropertyPane("tablewidget");
      // Disable isSortable
      // Confirm if isSortable is false
      _.agHelper.CheckUncheck(commonlocators.isSortable_tablev1, false);

      // Publish App
      _.deployMode.DeployApp();
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
      cy.contains('[role="columnheader"]', "userName").first().click({
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
   _.deployMode.NavigateBacktoEditor();
    _.table.SelectTableRow(1);
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
  },
);
