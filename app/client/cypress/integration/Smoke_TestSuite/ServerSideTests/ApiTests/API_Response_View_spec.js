const testdata = require("../../../../fixtures/testdata.json");
import { ObjectsRegistry } from "../../../../support/Objects/Registry";
import apiEditor from "../../../../locators/ApiEditor";
const testUrl1 = "http://localhost:5001/v1/dynamicrecords/getstudents";
const agHelper = ObjectsRegistry.AggregateHelper,
  apiPage = ObjectsRegistry.ApiPage;

describe("Bug 14666: Api Response Test Functionality ", function() {
  it("Test table loading when data is in array format", function() {
    cy.log("Login Successful");
    cy.NavigateToAPI_Panel();
    cy.log("Navigation to API Panel screen successful");
    apiPage.CreateAndFillApi(testUrl1, "TableTestAPI");
    agHelper.AssertAutoSave();
    apiPage.RunAPI();
    cy.get(apiEditor.tableResponseTab).should("exist");
    cy.DeleteAPI();
  });

  it("Test table loading when data is not in array format", function() {
    cy.log("Login Successful");
    cy.NavigateToAPI_Panel();
    cy.log("Navigation to API Panel screen successful");
    apiPage.CreateAndFillApi(
      testdata.baseUrl + testdata.methods,
      "TableTestAPI",
    );
    agHelper.AssertAutoSave();
    apiPage.RunAPI();
    cy.get(apiEditor.tableResponseTab).should("not.exist");
    cy.DeleteAPI();
  });
});
