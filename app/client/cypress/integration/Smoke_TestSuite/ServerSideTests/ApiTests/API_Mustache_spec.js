/* eslint-disable cypress/no-unnecessary-waiting */
const commonlocators = require("../../../../locators/commonlocators.json");
const dsl = require("../../../../fixtures/commondsl.json");
const widgetsPage = require("../../../../locators/Widgets.json");
const testdata = require("../../../../fixtures/testdata.json");
const pages = require("../../../../locators/Pages.json");
var appId = " ";

describe("Moustache test Functionality", function() {
  before(() => {
    appId = localStorage.getItem("applicationId");
    cy.log("appID:" + appId);
  });
  beforeEach(() => {
    cy.addDsl(dsl, appId);
  });
  it("Moustache test Functionality", function() {
    cy.openPropertyPane("textwidget");
    cy.widgetText("Api", widgetsPage.textWidget, widgetsPage.textInputval);
    cy.testCodeMirror("users");
    cy.NavigateToAPI_Panel();
    cy.log("Navigation to API Panel screen successful");
    cy.CreateAPI("TestAPINew");
    cy.log("Creation of API Action successful");
    cy.enterDatasourceAndPath(testdata.baseUrl, testdata.moustacheMethod);
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(1000);
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
