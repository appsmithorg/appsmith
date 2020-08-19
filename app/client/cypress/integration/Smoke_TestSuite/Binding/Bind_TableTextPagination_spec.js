const commonlocators = require("../../../locators/commonlocators.json");
const dsl = require("../../../fixtures/tableTextPaginationDsl.json");
const pages = require("../../../locators/Pages.json");
const apiPage = require("../../../locators/ApiEditor.json");
const publishPage = require("../../../locators/publishWidgetspage.json");

describe("Test Create Api and Bind to Table widget", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Test_Add Paginate with Table Page No and Execute the Api", function() {
    /**Create an Api1 of Paginate with Table Page No */
    cy.createAndFillApi(this.data.paginationUrl, this.data.paginationParam);
    cy.RunAPI();
  });

  it("Table-Text, Validate Server Side Pagination of Paginate with Table Page No", function() {
    cy.get(pages.widgetsEditor).click();
    cy.openPropertyPane("tablewidget");
    /**Bind Api1 with Table widget */
    cy.testJsontext("tabledata", "{{Api1.data.users}}");
    cy.CheckWidgetProperties(commonlocators.serverSidePaginationCheckbox);
    /**Bind Table with Textwidget with selected row */
    cy.get(pages.widgetsEditor).click();
    cy.openPropertyPane("textwidget");
    cy.testJsontext("text", "{{Table1.selectedRow.url}}");
    cy.readTabledata("0", "0").then(tabData => {
      const tableData = tabData;
      localStorage.setItem("tableDataPage1", tableData);
    });
    /**Validate Table data on current page(page1) */
    cy.ValidateTableData("1");
    cy.get(commonlocators.rightArrowBtn).click({ force: true });
    cy.validateToastMessage("done");
    /**Validate Table data on next page(page2) */
    cy.ValidateTableData("11");
  });

  it("Table-Text, Validate Publish Mode on Server Side Pagination of Paginate with Table Page No", function() {
    cy.PublishtheApp();
    cy.ValidatePublishTableData("1");
    cy.get(commonlocators.rightArrowBtn).click({ force: true });
    cy.validateToastMessage("done");
    cy.ValidatePublishTableData("11");

    cy.get(publishPage.backToEditor).click({ force: true });
  });

  it("Test_Add Paginate with Response URL and Execute the Api", function() {
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
    cy.get(pages.widgetsEditor).click();
    cy.openPropertyPane("textwidget");
    /** Bind the Table widget with Text widget*/
    cy.testJsontext("text", "{{Table1.selectedRow.url}}");
    cy.get(commonlocators.editPropCrossButton).click();
    cy.get(pages.widgetsEditor).click();
    cy.openPropertyPane("tablewidget");
    cy.testJsontext("tabledata", "{{Api2.data.users}}");
    cy.callApi("Api2");
  });

  it("Table-Text, Validate Server Side Pagination of Paginate with Response URL", function() {
    /**Validate Response data with Table data in Text Widget */
    cy.ValidatePaginateResponseUrlData(apiPage.apiPaginationPrevTest);
    cy.PublishtheApp();
    cy.ValidatePaginationInputData();
    cy.get(publishPage.backToEditor).click({ force: true });
    cy.ValidatePaginateResponseUrlData(apiPage.apiPaginationNextTest);
  });
});
