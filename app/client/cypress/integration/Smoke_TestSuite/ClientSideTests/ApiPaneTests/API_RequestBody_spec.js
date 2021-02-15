const testdata = require("../../../fixtures/testdata.json");
const apiEditor = require("../../../locators/ApiEditor.json");
const apiwidget = require("../../../locators/apiWidgetslocator.json");

describe("API Panel request body", function() {
  it("Check whether input exists when form-encoded is selected", function() {
    cy.NavigateToAPI_Panel();
    cy.CreateAPI("FirstAPI");

    cy.SelectAction(testdata.postAction);

    cy.get(apiEditor.bodyType).click();
    cy.contains(testdata.apiFormDataBodyType).click();

    cy.xpath(apiwidget.formEncoded).should("be.visible");

    cy.DeleteAPI();
  });
});
