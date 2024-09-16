/* eslint-disable cypress/no-unnecessary-waiting */
const widgetsPage = require("../../../../../locators/Widgets.json");
const commonlocators = require("../../../../../locators/commonlocators.json");
import * as _ from "../../../../../support/Objects/ObjectsCore";

describe(
  "Table Widget V2 Functionality",
  { tags: ["@tag.Widget", "@tag.Table"] },
  function () {
    before(() => {
      _.agHelper.AddDsl("tableV2WidgetDsl");
    });

    it("1. Table Widget V2 Functionality", function () {
      cy.openPropertyPane("tablewidgetv2");

      /**
       * @param{Text} Random Text
       * @param{ChartWidget}Mouseover
       * @param{ChartPre Css} Assertion
       */
      cy.widgetText(
        "Table1",
        widgetsPage.tableWidgetV2,
        widgetsPage.widgetNameSpan,
      );
      cy.testJsontext("tabledata", JSON.stringify(this.dataSet.TableInput));
      cy.wait("@updateLayout");
    });

    it("2. Table Widget V2 Functionality To Verify The Data", function () {
      cy.readTableV2dataPublish("1", "3").then((tabData) => {
        const tabValue = tabData;
        expect(tabValue).to.be.equal("Lindsay Ferguson");
        cy.log("the value is" + tabValue);
      });
    });

    it("3. Table Widget V2 Functionality To Show a Base64 Image", function () {
      cy.openPropertyPane("tablewidgetv2");
      cy.editColumn("image");
      cy.changeColumnType("Image");
      _.table.SelectTableRow(1, 0, true, "v2");

      const index = 1;
      const imageVal = this.dataSet.TableInput[index].image;
      cy.readTableV2LinkPublish(index, "1").then((hrefVal) => {
        expect(hrefVal).to.contain(imageVal);
      });
    });

    it("4. Table Widget V2 Functionality To Check if Table is Sortable", function () {
      cy.get(commonlocators.editPropBackButton).click();
      cy.openPropertyPane("tablewidgetv2");
      // Confirm if isSortable is true
      cy.get(commonlocators.isSortable).should("be.checked");
      // Publish App
      _.deployMode.DeployApp();
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
      cy.contains('[role="columnheader"] .draggable-header', "userName")
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
      _.deployMode.NavigateBacktoEditor();

      cy.openPropertyPane("tablewidgetv2");
      // Disable isSortable
      // Confirm if isSortable is false
      _.agHelper.CheckUncheck(commonlocators.isSortable, false);

      // Publish App
      _.deployMode.DeployApp();
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
      cy.contains('[role="columnheader"]', "userName").first().click({
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
      _.deployMode.NavigateBacktoEditor();
    });

    it("5. Verify that table filter dropdown only includes filterable columns", () => {
      cy.openPropertyPane("tablewidgetv2");
      cy.wait(500);
      _.propPane.UpdatePropertyFieldValue(
        "Table data",
        `{{[{step: 1, task: 1}]}}`,
      );
      cy.get(".t--property-control-allowfiltering input").click();
      cy.editColumn("step");
      cy.get(".t--table-filter-toggle-btn").click();

      [
        {
          columnType: "URL",
          expected: "contain",
        },
        {
          columnType: "Number",
          expected: "contain",
        },
        {
          columnType: "Date",
          expected: "contain",
        },
        {
          columnType: "Image",
          expected: "not.contain",
        },
        {
          columnType: "Video",
          expected: "not.contain",
        },
        {
          columnType: "Button",
          expected: "not.contain",
        },
        {
          columnType: "Menu button",
          expected: "not.contain",
        },
        {
          columnType: "Icon button",
          expected: "not.contain",
        },
        {
          columnType: "Plain text",
          expected: "contain",
        },
        {
          columnType: "Checkbox",
          expected: "contain",
        },
        {
          columnType: "Switch",
          expected: "contain",
        },
      ].forEach((data) => {
        cy.get(commonlocators.changeColType).last().click();
        cy.get(".t--dropdown-option")
          .children()
          .contains(data.columnType)
          .click();
        cy.wait("@updateLayout");
        cy.get(".t--table-filter-columns-dropdown").click();
        cy.get(".t--dropdown-option").should(data.expected, "step");
      });

      cy.get("[data-testid='t--property-pane-back-btn']").click();
      _.table.toggleColumnEditableViaColSettingsPane("step", "v2", true, true);
      cy.get(".t--table-filter-columns-dropdown").click();
      cy.get(".t--dropdown-option").should("not.contain", "Save / Discard");
    });

    it("6. Verify that table filter is retained when the tableData scehma doesn't change", () => {
      cy.openPropertyPane("tablewidgetv2");
      _.propPane.UpdatePropertyFieldValue(
        "Table data",
        `{{[{number: "1", work: "test"}, {number: "2", work: "celebrate!"}]}}`,
      );
      _.table.OpenNFilterTable("number", "contains", "2");
      cy.get(".t--table-filter-toggle-btn").should("have.text", "Filters (1)");
      cy.readTableV2data(0, 0).then((val) => {
        expect(val).to.equal("2");
      });
      _.propPane.UpdatePropertyFieldValue(
        "Table data",
        `{{[{number: "1.1", work: "test"}, {number: "2", work: "celebrate!"}]}}`,
      );
      cy.get(".t--table-filter-toggle-btn").should("have.text", "Filters (1)");
      cy.readTableV2data(0, 0).then((val) => {
        expect(val).to.equal("2");
      });
      cy.get(".t--close-filter-btn").click({ force: true });
      _.propPane.UpdatePropertyFieldValue(
        "Table data",
        `{{[{number: "1.1", task: "test"}, {number: "2", task: "celebrate!"}]}}`,
      );
      cy.get(".t--table-filter-toggle-btn").should("have.text", "Filters");
      cy.readTableV2data(0, 0).then((val) => {
        expect(val).to.equal("1.1");
      });
      _.table.OpenNFilterTable("number", "contains", "2");
      cy.get(".t--table-filter-toggle-btn").should("have.text", "Filters (1)");
      cy.readTableV2data(0, 0).then((val) => {
        expect(val).to.equal("2");
      });
      cy.get(".t--close-filter-btn").click({ force: true });
      _.propPane.UpdatePropertyFieldValue(
        "Table data",
        `{{[{number: "1", task: "test"}, {number: "2", task: "celebrate!"}]}}`,
      );
      cy.get(".t--table-filter-toggle-btn").should("have.text", "Filters (1)");
      cy.readTableV2data(0, 0).then((val) => {
        expect(val).to.equal("2");
      });
    });

    it("7. should check that adding cyclic dependency in the table doesn't crash the app", () => {
      //_.deployMode.NavigateBacktoEditor();
      cy.openPropertyPane("tablewidgetv2");

      cy.updateCodeInput(
        ".t--property-control-defaultselectedrow",
        `{{Table1}}`,
      );

      cy.get(".t--widget-tablewidgetv2").should("exist");
    });
  },
);
