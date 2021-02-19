const testdata = require("../../../../fixtures/testdata.json");
const apiwidget = require("../../../../locators/apiWidgetslocator.json");

describe("API Panel Test Functionality", function() {
  afterEach(function() {
    cy.get(".t--apiFormDeleteBtn").click();
    cy.wait("@deleteAction").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
  });

  it("Test GET Action for mock API with header and pagination", function() {
    const apiname = "SecondAPI";
    cy.CreateAPI(apiname);
    cy.log("Creation of API Action successful");
    cy.enterDatasourceAndPath(testdata.baseUrl, testdata.methods);
    cy.WaitAutoSave();
    cy.RunAPI();
    cy.validateRequest(testdata.baseUrl, testdata.methods, testdata.Get);
    cy.ResponseStatusCheck(testdata.successStatusCode);
    cy.log("Response code check successful");
    cy.ResponseCheck(testdata.responsetext);
    cy.log("Response data check successful");
  });
});
