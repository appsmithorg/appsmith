const commonlocators = require("../../../../locators/commonlocators.json");
const dsl = require("../../../../fixtures/tableTextPaginationDsl.json");
const publishPage = require("../../../../locators/publishWidgetspage.json");
const testdata = require("../../../../fixtures/testdata.json");
import apiPage from "../../../../locators/ApiEditor";

describe("Test Create Api and Bind to Table widget", function () {
  before(() => {
    cy.addDsl(dsl);
  });
  it("1. Test_Add Paginate with Table Page No and Execute the Api", function () {
    cy.wait(3000);
    /**Create an Api1 of Paginate with Table Page No */
    cy.createAndFillApi(this.data.paginationUrl, this.data.paginationParam);
    cy.RunAPI();
  });

  it("2. Table-Text, Validate Server Side Pagination of Paginate with Table Page No", function () {
    cy.SearchEntityandOpen("Table1");
    cy.EnableAllCodeEditors();
    /**Bind Api1 with Table widget */
    cy.testJsontext("tabledata", "{{Api1.data}}");
    cy.CheckWidgetProperties(commonlocators.serverSidePaginationCheckbox);
    /**Bind Table with Textwidget with selected row */
    cy.SearchEntityandOpen("Text1");
    cy.testJsontext("text", "{{Table1.selectedRow.avatar}}");
    cy.SearchEntityandOpen("Table1");
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
    cy.PublishtheApp();
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
    cy.get(publishPage.backToEditor).click({ force: true });
    cy.wait(3000);
    cy.CheckAndUnfoldEntityItem("Widgets");
    cy.get(".t--entity-name").contains("Table1").click({ force: true });
    cy.testJsontext("totalrecordcount", 20);
    cy.PublishtheApp();
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
    cy.get(publishPage.backToEditor).click({ force: true });
    cy.wait(3000);
    /** Create Api2 of Paginate with Response URL*/
    cy.createAndFillApi(this.data.paginationUrl, this.data.paginationParam);
    cy.RunAPI();
    cy.NavigateToPaginationTab();
    cy.get(apiPage.apiPaginationNextText).type(
      this.data.paginationUrl + testdata.nextUrl,
      {
        parseSpecialCharSequences: false,
      },
    );
    cy.get(apiPage.apiPaginationPrevText).type(
      this.data.paginationUrl + testdata.prevUrl,
      {
        parseSpecialCharSequences: false,
      },
    );
    cy.WaitAutoSave();
    cy.CheckAndUnfoldEntityItem("Widgets");
    //cy.get(".t--entity-name:contains(Text1)").click({ force: true });
    //cy.openPropertyPane("textwidget");
    /** Bind the Table widget with Text widget*/
    //cy.testJsontext("text", "{{Table1.selectedRow.avatar}}");
    cy.get(".t--entity-name:contains(Table1)").click({ force: true });
    cy.testJsontext("tabledata", "{{Api2.data}}");
    cy.callApi("Api2");
  });

  it("6. Table-Text, Validate Server Side Pagination of Paginate with Response URL", function () {
    /**Validate Response data with Table data in Text Widget */
    cy.SearchEntityandOpen("Table1");
    cy.ValidatePaginateResponseUrlData(apiPage.apiPaginationPrevTest, false);
    cy.PublishtheApp();
    cy.wait("@postExecute").then((interception) => {
      let valueToTest = JSON.stringify(
        interception.response.body.data.body[0].name,
      );
      cy.ValidatePaginationInputData(valueToTest);
    });
    cy.get(publishPage.backToEditor).click({ force: true });
    cy.wait(3000);
    cy.SearchEntityandOpen("Table1");
    cy.ValidatePaginateResponseUrlData(apiPage.apiPaginationNextTest, true);
  });
});
