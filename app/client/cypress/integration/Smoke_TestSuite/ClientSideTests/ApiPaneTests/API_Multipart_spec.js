const testdata = require("../../../../fixtures/testdata.json");
const apiEditor = require("../../../../locators/ApiEditor.json");
const apiwidget = require("../../../../locators/apiWidgetslocator.json");

describe("API Panel request body", function() {
  it("Check whether input and type dropdown selector exist when multi-part is selected", function() {
    cy.NavigateToAPI_Panel();
    cy.CreateAPI("FirstAPI");

    cy.SelectAction(testdata.postAction);

    cy.contains(apiEditor.bodyTab).click();
    cy.get(`[data-cy=${testdata.apiContentTypeForm}]`).click();
    cy.get(`[data-cy=${testdata.apiContentTypeMultiPart}]`).click();

    cy.get(apiwidget.formEncoded).should("be.visible");
    cy.get(apiwidget.multipartTypeDropdown).should("be.visible");
    cy.DeleteAPI();
  });

  it("Checks whether No body error message is shown when None API body content type is selected", function() {
    cy.NavigateToAPI_Panel();
    cy.CreateAPI("FirstAPI");

    cy.SelectAction(testdata.getAction);

    cy.contains(apiEditor.bodyTab).click();
    cy.get(testdata.noBodyErrorMessageDiv).should("exist");
    cy.get(testdata.noBodyErrorMessageDiv).contains(
      testdata.noBodyErrorMessage,
    );
    cy.DeleteAPI();
  });

  it("Checks whether header content type is being changed when FORM_URLENCODED API body content type is selected", function() {
    cy.NavigateToAPI_Panel();
    cy.CreateAPI("FirstAPI");

    cy.SelectAction(testdata.postAction);

    cy.contains(apiEditor.bodyTab).click({ force: true });
    cy.get(`[data-cy=${testdata.apiContentTypeForm}]`).click();
    cy.contains(apiEditor.headersTab).click({ force: true });

    cy.get(apiwidget.headerKey).contains(testdata.headerKey.toLowerCase());
    cy.get(apiwidget.headerValue).contains(testdata.apiFormDataHeaderValue);

    cy.DeleteAPI();
  });

  it("Checks whether content type is preserved when user selects None API body content type", function() {
    cy.NavigateToAPI_Panel();
    cy.CreateAPI("FirstAPI");

    cy.SelectAction(testdata.postAction);

    cy.contains(apiEditor.bodyTab).click({ force: true });
    cy.get(`[data-cy=${testdata.apiContentTypeForm}]`).click({ force: true });
    cy.get(`[data-cy=${testdata.apiContentTypeNone}]`).click({ force: true });
    cy.contains(apiEditor.headersTab).click({ force: true });

    cy.get(apiwidget.headerKey).contains(testdata.headerKey.toLowerCase());
    cy.get(apiwidget.headerValue).contains(testdata.apiFormDataHeaderValue);

    cy.DeleteAPI();
  });
});
