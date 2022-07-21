const testdata = require("../../../../fixtures/testdata.json");
const apiwidget = require("../../../../locators/apiWidgetslocator.json");
import apiEditor from "../../../../locators/ApiEditor";

describe("API Panel request body", function() {
  it("Check whether input exists when form-encoded is selected", function() {
    cy.NavigateToAPI_Panel();
    cy.CreateAPI("FirstAPI");

    cy.SelectAction(testdata.postAction);

    cy.contains(apiEditor.bodyTab).click();
    cy.contains(testdata.apiFormDataBodyType).click();

    cy.get(apiwidget.formEncoded).should("be.visible");

    cy.DeleteAPI();
  });
});
