import EditorNavigation, {
  EntityType,
  AppSidebarButton,
  AppSidebar,
  PageLeftPane,
} from "../../../../support/Pages/EditorNavigation";

const testdata = require("../../../../fixtures/testdata.json");
const apiwidget = require("../../../../locators/apiWidgetslocator.json");

import {
  agHelper,
  entityExplorer,
  entityItems,
} from "../../../../support/Objects/ObjectsCore";

describe(
  "API Panel Test Functionality",
  { tags: ["@tag.Datasource", "@tag.Git", "@tag.AccessControl"] },
  function () {
    before(() => {
      agHelper.AddDsl("uiBindDsl");
    });

    it("1. Test Search API fetaure", function () {
      cy.log("Login Successful");
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
      EditorNavigation.SelectEntityByName("FirstAPI", EntityType.Api);
      entityExplorer.RenameEntityFromExplorer("FirstAPI", "SecondAPI", true);
      agHelper.ActionContextMenuWithInPane({
        action: "Delete",
        entityType: entityItems.Api,
      });
      AppSidebar.navigate(AppSidebarButton.Editor);
      PageLeftPane.assertAbsence("SecondAPI");
    });

    it("2. Should update loading state after cancellation of confirmation for run query", function () {
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
      cy.CreateAPI("APIWithQueryParams");
      cy.enterDatasourceAndPath(
        testdata.baseUrl,
        testdata.methodWithQueryParam,
      );
      cy.ValidateQueryParams({
        key: "q",
        value: "mimeType='application/vnd.google-apps.spreadsheet'",
      });
    });

    it("5. Shows evaluated value pane when url field is focused", function () {
      cy.CreateAPI("TestAPI");
      cy.get(".CodeMirror textarea")
        .first()
        .click({
          force: true,
        })
        .type(
          "http://host.docker.internal:5001/{{Button2.text}}?key=test&val={{Button2.text}}",
          { force: true, parseSpecialCharSequences: false },
        )
        .wait(3000)
        .click({
          force: true,
        })
        .type("{enter}", { parseSpecialCharSequences: true });

      cy.validateEvaluatedValue(
        "http://host.docker.internal:5001/Cancel?key=test&val=Cancel",
      );
    });
  },
);
