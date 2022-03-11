const commonlocators = require("../../../../locators/commonlocators.json");
const dsl = require("../../../../fixtures/tableTextPaginationDsl.json");
const pages = require("../../../../locators/Pages.json");
const apiPage = require("../../../../locators/ApiEditor.json");
const publishPage = require("../../../../locators/publishWidgetspage.json");

describe("Test Create Api and Bind to Table widget", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Test_Add Paginate with Table Page No and Execute the Api", function() {
    cy.wait(30000);
    /**Create an Api1 of Paginate with Table Page No */
    cy.createAndFillApi(
      this.data.paginationUrl,
      "users?page={{Table1.pageNo}}&pageSize={{Table1.pageSize}}",
    );
    cy.RunAPI();
  });

  it("Table-Text, Validate Server Side Pagination of Paginate with Table Page No", function() {
    cy.SearchEntityandOpen("Table1");
    /**Bind Api1 with Table widget */
    cy.testJsontext("tabledata", "{{Api1.data.users}}");
    cy.CheckWidgetProperties(commonlocators.serverSidePaginationCheckbox);
    /**Bind Table with Textwidget with selected row */
    cy.SearchEntityandOpen("Text1");
    cy.testJsontext("text", "{{Table1.selectedRow.avatar}}");
    cy.SearchEntityandOpen("Table1");
    cy.readTabledata("0", "0").then((tabData) => {
      const tableData = tabData;
      localStorage.setItem("tableDataPage1", tableData);
    });
    /**Validate Table data on current page(page1) */
    cy.ValidateTableData("1");
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

  it("Table-Text, Validate Publish Mode on Server Side Pagination of Paginate with Table Page No", function() {
    cy.PublishtheApp();
    cy.wait(500);
    // Make sure onPageLoad action has run before validating the data
    cy.wait("@postExecute");
    cy.wait(2000);
    cy.ValidatePublishTableData("1");
    cy.get(commonlocators.tableNextPage).click({ force: true });
    // Make sure net page action is run
    cy.wait("@postExecute");
    cy.validateToastMessage("done");
    cy.ValidatePublishTableData("11");
  });

  it("Table-Text, Validate Server Side Pagination of Paginate with Total Records Count", function() {
    cy.get(publishPage.backToEditor).click({ force: true });
    cy.wait(30000);
    cy.selectEntityByName("WIDGETS");
    cy.get(".t--entity-name")
      .contains("Table1")
      .click({ force: true });
    cy.testJsontext("totalrecordcount", 20);
    cy.PublishtheApp();
    cy.wait(500);
    cy.wait("@postExecute");
    cy.wait(500);
    cy.get(".t--table-widget-next-page").should("not.have.attr", "disabled");
    cy.ValidateTableData("1");

    cy.get(commonlocators.tableNextPage).click({ force: true });
    cy.wait("@postExecute");
    cy.wait(500);
    cy.get(".t--table-widget-next-page").should("have.attr", "disabled");
  });

  it("Test_Add Paginate with Response URL and Execute the Api", function() {
    cy.get(publishPage.backToEditor).click({ force: true });
    cy.wait(30000);
    /** Create Api2 of Paginate with Response URL*/
    cy.createAndFillApi(this.data.paginationUrl, "users");
    cy.RunAPI();
    cy.NavigateToPaginationTab();
    cy.get(apiPage.apiPaginationNextText).type("{{Api2.data.next}}", {
      parseSpecialCharSequences: false,
    });
    cy.get(apiPage.apiPaginationPrevText).type("{{Api2.data.previous}}", {
      parseSpecialCharSequences: false,
    });
    cy.WaitAutoSave();
    cy.selectEntityByName("WIDGETS");
    //cy.get(".t--entity-name:contains(Text1)").click({ force: true });
    //cy.openPropertyPane("textwidget");
    /** Bind the Table widget with Text widget*/
    //cy.testJsontext("text", "{{Table1.selectedRow.avatar}}");
    cy.get(".t--entity-name:contains(Table1)").click({ force: true });
    cy.testJsontext("tabledata", "{{Api2.data.users}}");
    cy.callApi("Api2");
  });

  it("Table-Text, Validate Server Side Pagination of Paginate with Response URL", function() {
    /**Validate Response data with Table data in Text Widget */
    cy.SearchEntityandOpen("Table1");
    cy.ValidatePaginateResponseUrlData(apiPage.apiPaginationPrevTest);
    cy.PublishtheApp();
    cy.ValidatePaginationInputData();
    cy.get(publishPage.backToEditor).click({ force: true });
    cy.wait(30000);
    cy.SearchEntityandOpen("Table1");
    cy.ValidatePaginateResponseUrlData(apiPage.apiPaginationNextTest);
    cy.wait(5000);
  });
});
