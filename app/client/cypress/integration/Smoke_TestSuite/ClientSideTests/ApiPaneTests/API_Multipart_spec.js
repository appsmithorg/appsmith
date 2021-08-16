const testdata = require("../../../../fixtures/testdata.json");
const apiEditor = require("../../../../locators/ApiEditor.json");
const apiwidget = require("../../../../locators/apiWidgetslocator.json");

describe("API Panel request body", function() {
  it("Check whether input and type dropdown selector exist when multi-part is selected", function() {
    cy.NavigateToAPI_Panel();
    cy.CreateAPI("FirstAPI");

    cy.SelectAction(testdata.postAction);

    cy.contains(apiEditor.bodyTab).click();
    cy.contains(testdata.apiFormDataBodyType).click();
    cy.contains(testdata.apiMultipartBodyType).click();

    cy.get(apiwidget.formEncoded).should("be.visible");
    cy.get(apiwidget.multipartTypeDropdown).should("be.visible");
    cy.DeleteAPI();
  });
});
