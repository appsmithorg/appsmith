const commonlocators = require("../../../../locators/commonlocators.json");
const testdata = require("../../../../fixtures/testdata.json");
import apiPage from "../../../../locators/ApiEditor";
import * as _ from "../../../../support/Objects/ObjectsCore";

describe("Test Create Api and Bind to Table widget", function () {
  before(() => {
    cy.fixture("tableTextPaginationDsl").then((val) => {
      _.agHelper.AddDsl(val);
    });
  });
  it("1. Test_Add Paginate with Table Page No and Execute the Api", function () {
    /**Create an Api1 of Paginate with Table Page No */ _.apiPage.CreateAndFillApi(
      this.dataSet.paginationUrl + this.dataSet.paginationParam,
    );
    _.apiPage.RunAPI();
    // Table-Text, Validate Server Side Pagination of Paginate with Table Page No
    _.entityExplorer.SelectEntityByName("Table1");

    cy.EnableAllCodeEditors();
    /**Bind Api1 with Table widget */
    cy.testJsontext("tabledata", "{{Api1.data}}");
    cy.CheckWidgetProperties(commonlocators.serverSidePaginationCheckbox);
    /**Bind Table with Textwidget with selected row */
    _.entityExplorer.SelectEntityByName("Text1");

    cy.testJsontext("text", "{{Table1.selectedRow.avatar}}");
    _.entityExplorer.SelectEntityByName("Table1");

    /**Validate Table data on current page(page1) */
    cy.readTabledata("0", "4").then((tabData) => {
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

  it("3. Table-Text, Validate Publish Mode on Server Side Pagination of Paginate with Table Page No", function () {
    _.deployMode.DeployApp();
    cy.wait(500);
    // Make sure onPageLoad action has run before validating the data
    cy.wait("@postExecute");
    cy.wait(2000);
    cy.readTabledata("0", "4").then((tabData) => {
      const tableData = tabData;
      expect(tableData).to.equal("1");
    });
    cy.get(commonlocators.tableNextPage).click({ force: true });
    // Make sure net page action is run
    cy.wait("@postExecute");
    cy.validateToastMessage("done");
    cy.readTabledata("0", "4").then((tabData) => {
      const tableData = tabData;
      expect(tableData).to.equal("11");
    });
  });

  it("4. Table-Text, Validate Server Side Pagination of Paginate with Total Records Count", function () {
    _.deployMode.NavigateBacktoEditor();
    cy.wait(3000);
    cy.CheckAndUnfoldEntityItem("Widgets");
    cy.get(".t--entity-name").contains("Table1").click({ force: true });
    cy.testJsontext("totalrecordcount", 20);
    _.deployMode.DeployApp();
    cy.wait(500);
    cy.wait("@postExecute");
    cy.wait(500);
    cy.get(".show-page-items").should("contain", "20 Records");
    cy.get(".page-item").next().should("contain", "of 2");

    cy.get(".t--table-widget-next-page").should("not.have.attr", "disabled");
    cy.readTabledata("0", "4").then((tabData) => {
      const tableData = tabData;
      expect(tableData).to.equal("1");
    });
    cy.get(commonlocators.tableNextPage).click({ force: true });
    cy.wait("@postExecute");
    cy.wait(500);
    cy.get(".t--table-widget-next-page").should("have.attr", "disabled");
  });

  it("5. Test_Add Paginate with Response URL and Execute the Api", function () {
    _.deployMode.NavigateBacktoEditor();
    cy.wait(3000);
    /** Create Api2 of Paginate with Response URL*/

    _.apiPage.CreateAndFillApi(
      this.dataSet.paginationUrl + this.dataSet.paginationParam,
    );
    _.apiPage.RunAPI();
    _.apiPage.SelectPaneTab("Pagination");
    _.agHelper.GetNClick(apiPage.apiPaginationTab);
    cy.get(apiPage.apiPaginationNextText).type(
      this.dataSet.paginationUrl + testdata.nextUrl,
      {
        parseSpecialCharSequences: false,
      },
    );
    cy.get(apiPage.apiPaginationPrevText).type(
      this.dataSet.paginationUrl + testdata.prevUrl,
      {
        parseSpecialCharSequences: false,
      },
    );

    //cy.get(".t--entity-name:contains(Text1)").click({ force: true });
    //cy.openPropertyPane("textwidget");
    /** Bind the Table widget with Text widget*/
    //cy.testJsontext("text", "{{Table1.selectedRow.avatar}}");
    _.entityExplorer.SelectEntityByName("Table1", "Widgets");
    _.propPane.UpdatePropertyFieldValue("Table data", "{{Api2.data}}");
    cy.executeDbQuery("Api2", "onPageChange");
  });

  it("6. Table-Text, Validate Server Side Pagination of Paginate with Response URL", function () {
    /**Validate Response data with Table data in Text Widget */
    _.entityExplorer.SelectEntityByName("Table1");

    cy.ValidatePaginateResponseUrlData(apiPage.apiPaginationPrevTest, false);
    _.deployMode.DeployApp();
    cy.wait("@postExecute").then((interception) => {
      let valueToTest = JSON.stringify(
        interception.response.body.data.body[0].name,
      );
      cy.ValidatePaginationInputData(valueToTest);
    });
    _.deployMode.NavigateBacktoEditor();
    cy.wait(3000);
    _.entityExplorer.SelectEntityByName("Table1", "Widgets");
    cy.ValidatePaginateResponseUrlData(apiPage.apiPaginationNextTest, true);
  });
});
