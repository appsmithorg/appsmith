const commonlocators = require("../../../locators/commonlocators.json");
const dsl = require("../../../fixtures/commondsl.json");
const widgetsPage = require("../../../locators/Widgets.json");
const testdata = require("../../../fixtures/testdata.json");

describe("Moustache test Functionality", function() {
  beforeEach(() => {
    cy.addDsl(dsl);
  });
  it("Moustache test Functionality", function() {
    cy.openPropertyPane("textwidget");
    cy.widgetText("Api", widgetsPage.textWidget, widgetsPage.textInputval);
    cy.testCodeMirror("/api/users/2");
    cy.NavigateToAPI_Panel();
    cy.log("Navigation to API Panel screen successful");
    cy.CreateAPI("TestAPINew");
    cy.log("Creation of API Action successful");
    cy.enterDatasourceAndPath(testdata.baseUrl2, testdata.moustacheMethod);
    cy.RunAPI();
    cy.ResponseStatusCheck(testdata.successStatusCode);
    cy.log("Response code check successful");
    cy.ResponseCheck("janet.weaver@reqres.in");
    cy.log("Response data check successful");
  });

  afterEach(() => {
    // put your clean up code if any
  });
});
