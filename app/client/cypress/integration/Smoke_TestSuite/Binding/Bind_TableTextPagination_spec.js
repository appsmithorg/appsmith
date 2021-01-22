const commonlocators = require("../../../locators/commonlocators.json");
const dsl = require("../../../fixtures/tableTextPaginationDsl.json");
const pages = require("../../../locators/Pages.json");
const apiPage = require("../../../locators/ApiEditor.json");
const publishPage = require("../../../locators/publishWidgetspage.json");

  before(() => {
    cy.addDsl(dsl);
  });

    /**Create an Api1 of Paginate with Table Page No */
    cy.createAndFillApi(this.data.paginationUrl, this.data.paginationParam);
    cy.RunAPI();
  });

    cy.SearchEntityandOpen("Table1");
    /**Bind Api1 with Table widget */
    cy.testJsontext("tabledata", "{{Api1.data.users}}");
    cy.CheckWidgetProperties(commonlocators.serverSidePaginationCheckbox);
    /**Bind Table with Textwidget with selected row */
    cy.SearchEntityandOpen("Text1");
    cy.testJsontext("text", "{{Table1.selectedRow.url}}");
    cy.SearchEntityandOpen("Table1");
      const tableData = tabData;
      localStorage.setItem("tableDataPage1", tableData);
    });
    /**Validate Table data on current page(page1) */
    cy.ValidateTableData("1");
    cy.get(commonlocators.tableNextPage).click({ force: true });
    cy.wait(5000);
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

    cy.PublishtheApp();
    cy.ValidatePublishTableData("1");
    cy.get(commonlocators.tableNextPage).click({ force: true });
    cy.wait("@postExecute").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.validateToastMessage("done");
    cy.ValidatePublishTableData("11");
    cy.get(publishPage.backToEditor).click({ force: true });
  });

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
    cy.SearchEntityandOpen("Text1");
    //cy.openPropertyPane("textwidget");
    /** Bind the Table widget with Text widget*/
    cy.testJsontext("text", "{{Table1.selectedRow.url}}");
    cy.get(commonlocators.editPropCrossButton).click();
    cy.SearchEntityandOpen("Table1");
    cy.testJsontext("tabledata", "{{Api2.data.users}}");
    cy.callApi("Api2");
  });

    /**Validate Response data with Table data in Text Widget */
    cy.ValidatePaginateResponseUrlData(apiPage.apiPaginationPrevTest);
    cy.PublishtheApp();
    cy.ValidatePaginationInputData();
    cy.get(publishPage.backToEditor).click({ force: true });
    cy.ValidatePaginateResponseUrlData(apiPage.apiPaginationNextTest);
  });
});
