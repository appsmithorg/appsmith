import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

const commonlocators = require("../../../../locators/commonlocators.json");
const testdata = require("../../../../fixtures/testdata.json");
import apiPageLocators from "../../../../locators/ApiEditor";
import {
  apiPage,
  deployMode,
  propPane,
  agHelper,
  locators,
  draggableWidgets,
  table,
} from "../../../../support/Objects/ObjectsCore";

describe(
  "Test Create Api and Bind to Table widget",
  { tags: ["@tag.Binding"] },
  function () {
    before(() => {
      agHelper.AddDsl("tableV2TextPaginationDsl");
    });

    it("1. Test_Add Paginate with Table Page No and Execute the Api", function () {
      cy.get(".t--canvas-artboard").should("be.visible");
      /**Create an Api1 of Paginate with Table Page No */
      apiPage.CreateAndFillApi(
        this.dataSet.paginationUrl + this.dataSet.paginationParam,
      );
      agHelper.VerifyEvaluatedValue(
        this.dataSet.paginationUrl + "mock-api?records=20&page=1&size=10",
      );
      apiPage.RunAPI();
      // Table-Text, Validate Server Side Pagination of Paginate with Table v2 Page No
      EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);
      /**Bind Api1 with Table widget */
      cy.testJsontext("tabledata", "{{Api1.data}}");
      cy.CheckWidgetProperties(commonlocators.serverSidePaginationCheckbox);
      /**Bind Table with Textwidget with selected row */
      EditorNavigation.SelectEntityByName("Text1", EntityType.Widget);

      cy.testJsontext("text", "{{Table1.selectedRow.avatar}}");
      EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);

      cy.readTableV2data("0", "0").then((tabData) => {
        const tableData = tabData;
        localStorage.setItem("tableDataPage1", tableData);
      });
      /**Validate Table data on current page(page1) */
      cy.readTableV2data("0", "4").then((tabData) => {
        const tableData = tabData;
        expect(tableData).to.equal("1");
      });
      //cy.get(commonlocators.tableNextPage).click({ force: true });
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      //cy.wait(5000);
      /*
    cy.wait("@postExecute").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.validateToastMessage("done");
    /**Validate Table data on next page(page2) */
      //cy.ValidateTableData("11");
    });

    it("2. Table-Text, Validate Publish Mode on Server Side Pagination of Paginate with Table v2 Page No", function () {
      deployMode.DeployApp();
      cy.get(".tbody").should("be.visible");
      // Make sure onPageLoad action has run before validating the data
      cy.wait("@postExecute");
      cy.get(".tbody").should("be.visible");
      cy.readTableV2data("0", "4").then((tabData) => {
        const tableData = tabData;
        expect(tableData).to.equal("1");
      });
      cy.get(commonlocators.tableNextPage).click({ force: true });
      // Make sure net page action is run
      cy.wait("@postExecute");
      cy.validateToastMessage("done");
      cy.readTableV2data("0", "4").then((tabData) => {
        const tableData = tabData;
        expect(tableData).to.equal("11");
      });
    });

    it("3. Table-Text, Validate Server Side Pagination of Paginate with Total v2 Records Count", function () {
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);
      propPane.ExpandIfCollapsedSection("pagination");
      propPane.UpdatePropertyFieldValue("Total Records", "20");
      deployMode.DeployApp();
      cy.wait("@postExecute");
      cy.get(".show-page-items").should("contain", "20 Records");
      cy.get(".page-item").next().should("contain", "of 2");

      cy.get(".t--table-widget-next-page").should("not.have.attr", "disabled");
      cy.readTableV2data("0", "4").then((tabData) => {
        const tableData = tabData;
        expect(tableData).to.equal("1");
      });
      cy.get(commonlocators.tableNextPage).click({ force: true });
      cy.wait("@postExecute");
      cy.get(".tbody").should("be.visible");
      cy.get(".t--table-widget-next-page").should("have.attr", "disabled");
    });

    it("4. Test_Add Paginate with Response URL and Execute the Api", function () {
      deployMode.NavigateBacktoEditor();
      cy.get(".t--canvas-artboard").should("be.visible");
      /** Create Api2 of Paginate with Response URL*/
      apiPage.CreateAndFillApi(
        this.dataSet.paginationUrl + this.dataSet.paginationParam,
      );
      agHelper.VerifyEvaluatedValue(
        this.dataSet.paginationUrl + "mock-api?records=20&page=1&size=10",
      );
      apiPage.RunAPI();
      cy.NavigateToPaginationTab();
      cy.get(apiPageLocators.apiPaginationNextText).type(
        this.dataSet.paginationUrl + testdata.nextUrl,
        {
          parseSpecialCharSequences: false,
        },
      );
      cy.get(apiPageLocators.apiPaginationPrevText).type(
        this.dataSet.paginationUrl + testdata.prevUrl,
        {
          parseSpecialCharSequences: false,
        },
      );

      /** Bind the Table widget with Text widget*/
      //cy.testJsontext("text", "{{Table1.selectedRow.avatar}}");
      EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);
      propPane.UpdatePropertyFieldValue("Table data", "{{Api2.data}}");
      cy.executeDbQuery("Api2", "onPageChange");
    });

    it("5. Table-Text, Validate Server Side Pagination of Paginate with Response URL", function () {
      /**Validate Response data with Table data in Text Widget */
      cy.get("body").then(($ele) => {
        if ($ele.find(locators._backToEditor).length) {
          deployMode.NavigateBacktoEditor();
        }
      });
      EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);

      cy.ValidatePaginateResponseUrlDataV2(
        apiPageLocators.apiPaginationPrevTest,
      );
      cy.get("@postExecute.all");
      deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.TABLE));
      table.WaitUntilTableLoad(0, 0, "v2");
      cy.get(".tbody").should("be.visible");
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);
      cy.ValidatePaginateResponseUrlDataV2(
        apiPageLocators.apiPaginationNextTest,
        true,
      );
    });
  },
);
