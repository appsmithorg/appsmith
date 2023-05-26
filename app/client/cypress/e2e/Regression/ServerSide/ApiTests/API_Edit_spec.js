const testdata = require("../../../../fixtures/testdata.json");
const apiwidget = require("../../../../locators/apiWidgetslocator.json");
const dsl = require("../../../../fixtures/uiBindDsl.json");
import * as _ from "../../../../support/Objects/ObjectsCore";

describe("API Panel Test Functionality", function () {
  before(() => {
    cy.addDsl(dsl);
  });
  it("1. Test Search API fetaure", function () {
    cy.log("Login Successful");
    cy.NavigateToAPI_Panel();
    cy.log("Navigation to API Panel screen successful");
    cy.CreateAPI("FirstAPI");
    cy.get(".CodeMirror-placeholder")
      .first()
      .should("have.text", "https://mock-api.appsmith.com/users");
    cy.log("Creation of FirstAPI Action successful");
    cy.enterDatasourceAndPath(testdata.baseUrl, testdata.methods);
    cy.SaveAndRunAPI();
    cy.validateRequest(
      "FirstAPI",
      testdata.baseUrl,
      testdata.methods,
      testdata.Get,
    );
    cy.ResponseStatusCheck(testdata.successStatusCode);
    _.entityExplorer.SelectEntityByName("FirstAPI", "Queries/JS");
    _.entityExplorer.RenameEntityFromExplorer("FirstAPI", "SecondAPI", true);
    _.agHelper.ActionContextMenuWithInPane("Delete");
    _.entityExplorer.AssertEntityAbsenceInExplorer("SecondAPI");
  });

  it("2. Should update loading state after cancellation of confirmation for run query", function () {
    cy.NavigateToAPI_Panel();
    cy.log("Navigation to API Panel screen successful");
    cy.CreateAPI("FirstAPI");
    cy.get(".CodeMirror-placeholder")
      .first()
      .should("have.text", "https://mock-api.appsmith.com/users");
    cy.log("Creation of FirstAPI Action successful");
    cy.enterDatasourceAndPath(testdata.baseUrl, testdata.methods);
    cy.get(apiwidget.settings).click({ force: true });
    cy.get(apiwidget.confirmBeforeExecute).click({ force: true });
    cy.get(apiwidget.runQueryButton).click();
    cy.get(".ads-v2-modal__content").find("button").contains("No").click();
    cy.get(apiwidget.runQueryButton).children().should("have.length", 1);
  });

  it("3. Should not crash on key delete", function () {
    cy.NavigateToAPI_Panel();
    cy.CreateAPI("CrashTestAPI");
    cy.SelectAction(testdata.postAction);
    cy.get(apiwidget.headerKey)
      .first()
      .click({ force: true })
      .type("{uparrow}", { parseSpecialCharSequences: true })
      .type("{ctrl}{shift}{downarrow}", { parseSpecialCharSequences: true })
      .type("{backspace}", { parseSpecialCharSequences: true });
    // assert so that this fails
    cy.get(apiwidget.headerKey).should("be.visible");
    cy.get(apiwidget.headerKey).should("have.value", "");
  });

  it("4. Should correctly parse query params", function () {
    cy.NavigateToAPI_Panel();
    cy.CreateAPI("APIWithQueryParams");
    cy.enterDatasourceAndPath(testdata.baseUrl, testdata.methodWithQueryParam);
    cy.ValidateQueryParams({
      key: "q",
      value: "mimeType='application/vnd.google-apps.spreadsheet'",
    });
  });
  // skipping test due to bug in evaulated value introduced by ADS changes
  it.skip("5. Shows evaluated value pane when url field is focused", function () {
    cy.NavigateToAPI_Panel();
    cy.CreateAPI("TestAPI");
    cy.get(".CodeMirror textarea")
      .first()
      .click({
        force: true,
      })
      .type(
        "https://www.facebook.com/users/{{Button2.text}}?key=test&val={{Button2.text}}",
        { force: true, parseSpecialCharSequences: false },
      )
      .wait(3000)
      .type("{enter}", { parseSpecialCharSequences: true });

    cy.validateEvaluatedValue(
      "https://www.facebook.com/users/Cancel?key=test&val=Cancel",
    );
  });
});
