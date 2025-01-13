const apiwidget = require("../../../../locators/apiWidgetslocator.json");
const testdata = require("../../../../fixtures/testdata.json");
const datasource = require("../../../../locators/DatasourcesEditor.json");
const datasourceEditor = require("../../../../locators/DatasourcesEditor.json");
const datasourceFormData = require("../../../../fixtures/datasources.json");
import {
  agHelper,
  jsEditor,
  dataSources,
} from "../../../../support/Objects/ObjectsCore";
import { PluginActionForm } from "../../../../support/Pages/PluginActionForm";

let pluginActionForm = new PluginActionForm();

describe(
  "Undo/Redo functionality",
  {
    tags: [
      "@tag.JS",
      "@tag.Datasource",
      "@tag.Git",
      "@tag.AccessControl",
      "@tag.Binding",
    ],
  },
  function () {
    const modifierKey = Cypress.platform === "darwin" ? "meta" : "ctrl";
    let postgresDatasourceName;

    it("1. Checks undo/redo in datasource forms", () => {
      dataSources.NavigateToDSCreateNew();
      agHelper.GetNClick(datasource.PostgreSQL);
      cy.generateUUID().then((uid) => {
        postgresDatasourceName = uid;

        cy.get(".t--edit-datasource-name").click();
        cy.get(".t--edit-datasource-name input")
          .clear()
          .type(postgresDatasourceName, { force: true })
          .should("have.value", postgresDatasourceName)
          .blur();

        cy.get(datasourceEditor.sectionAuthentication).click();
        cy.get(datasourceEditor.username).type(
          datasourceFormData["postgres-username"],
        );
        agHelper.AssertElementVisibility(datasourceEditor.password);
        cy.get(datasourceEditor.password).type(
          datasourceFormData["postgres-password"],
        );

        cy.get("body").type(`{${modifierKey}}z`);
        cy.get("body").type(`{${modifierKey}}{shift}z`);
        cy.get(datasourceEditor.saveBtn).click({ force: true });
        dataSources.AssertDSInActiveList(postgresDatasourceName);
      });
    });

    it("2. Checks undo/redo for Api pane", function () {
      cy.CreateAPI("FirstAPI");
      cy.get(`${apiwidget.resourceUrl} .CodeMirror-placeholder`).should(
        "have.text",
        "http://host.docker.internal:5001/v1/mock-api/users", //testing placeholder!
      );
      cy.enterDatasourceAndPath(testdata.baseUrl, testdata.methods);
      agHelper.RemoveUIElement(
        "Tooltip",
        Cypress.env("MESSAGES").ADD_QUERY_JS_TOOLTIP(),
      );
      cy.get(`${apiwidget.headerKey}`).type("Authorization");
      cy.get("body").click(0, 0);
      pluginActionForm.toolbar.toggleSettings();
      //cy.get(apiwidget.onPageLoad).click({ force: true });
      cy.get("body").click(0, 0);
      cy.get("body").type(`{${modifierKey}}z`);
      // cy.wait(2000);
      // cy.get("body").type(`{${modifierKey}}z`);
      cy.get("body").should("be.visible").click(0, 0);
      cy.get("body").type(`{${modifierKey}}z`);
      cy.get(apiwidget.headers)
        .parent()
        .should("have.attr", "aria-selected", "true");
      cy.get("body").type(`{${modifierKey}}z`);

      cy.get(`${apiwidget.resourceUrl} .CodeMirror-placeholder`).should(
        "have.text",
        "http://host.docker.internal:5001/v1/mock-api/users",
      );
      cy.get(`${apiwidget.headerKey} .CodeMirror-placeholder`).should(
        "have.text",
        "Key 1",
      );
      cy.get("body").type(`{${modifierKey}}{shift}z`);
      cy.get("body").type(`{${modifierKey}}{shift}z`);
      cy.get(`${apiwidget.headerKey} .cm-m-null`).should(
        "have.text",
        "Authorization",
      );
    });

    it("3. Checks undo/redo in query editor", () => {
      dataSources.CreateQueryForDS(postgresDatasourceName);
      cy.get(".CodeMirror textarea").first().focus().type("{{FirstAPI}}", {
        force: true,
        parseSpecialCharSequences: false,
      });
      cy.get("body").click(0, 0);

      // Removed the verification of relationships as we have removed the `Relationships` element from the new bindings UI

      cy.get("body").type(`{${modifierKey}}z`);
      cy.get(".CodeEditorTarget textarea").should(
        "not.have.text",
        "{{FirstAPI}}",
      );
      cy.get("body").type(`{${modifierKey}}{shift}z`);
      cy.get(".CodeMirror-code span").contains("{{FirstAPI}}");
      cy.get("body").type(`{${modifierKey}}z`);
      cy.get(".CodeMirror-code span")
        .last()
        .should("not.have.text", "{{FirstAPI}}");
    });

    it("4. Checks undo/redo in JS Objects", () => {
      jsEditor.NavigateToNewJSEditor();
      agHelper.AssertElementVisibility(".CodeMirror textarea");
      cy.get(".CodeMirror textarea")
        .first()
        .focus()
        .type("{downarrow}{downarrow}{downarrow}  ")
        .type("testJSFunction:()=>{},");
      cy.get("body").type(
        `{${modifierKey}}z{${modifierKey}}z{${modifierKey}}z`,
      );
      // verifying testJSFunction is not visible on page after undo
      cy.contains("testJSFunction").should("not.exist");
      cy.get("body").type(
        `{${modifierKey}}{shift}z{${modifierKey}}{shift}z{${modifierKey}}{shift}z`,
      );
      // verifying testJSFunction is visible on page after redo
      cy.contains("testJSFunction").should("exist");
      cy.get("body").type(`{${modifierKey}}z`);
      // cy.get(".function-name").should("not.contain.text", "test");
    });

    it("5. Checks undo/redo for Authenticated APIs", () => {
      cy.NavigateToAPI_Panel();
      cy.get(apiwidget.createAuthApiDatasource).click({ force: true });
      agHelper.AssertElementVisibility(dataSources._headerKey);
      agHelper.TypeText(dataSources._headerKey, testdata.headerKey);
      agHelper.TypeText(dataSources._urlInputControl, testdata.baseUrl);
      agHelper.AssertElementVisibility("body");
      cy.get("body").click(0, 0);
      cy.get("body").type(`{${modifierKey}}z`);
      cy.get("input[name='url']").should("have.value", "");
      cy.get("body").type(`{${modifierKey}}z`);
      cy.get("input[name='headers[0].key']").should("have.value", "");
      cy.get("body").click(0, 0);
      cy.get("body").type(`{${modifierKey}}{shift}z`);
      cy.get("body").type(`{${modifierKey}}{shift}z`);
      cy.get("input[name='url']").should("have.value", testdata.baseUrl);
      cy.get("input[name='headers[0].key']").should(
        "have.value",
        "Content-Type",
      );
    });
  },
);
