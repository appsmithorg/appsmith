const widgetsPage = require("../../../../locators/Widgets.json");
const testdata = require("../../../../fixtures/testdata.json");
import {
  entityExplorer,
  agHelper,
} from "../../../../support/Objects/ObjectsCore";

describe("Moustache test Functionality", function () {
  beforeEach(() => {
    agHelper.AddDsl("commondsl");
  });
  it("1. Moustache test Functionality", function () {
    entityExplorer.ExpandCollapseEntity("Aditya");
    entityExplorer.SelectEntityByName("TestTextBox", "Aditya");
    cy.widgetText("Api", widgetsPage.textWidget, widgetsPage.textInputval);
    cy.testCodeMirror(testdata.methods);
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
