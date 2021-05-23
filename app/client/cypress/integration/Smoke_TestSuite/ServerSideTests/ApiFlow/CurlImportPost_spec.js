const ApiEditor = require("../../../../locators/ApiEditor.json");
const apiwidget = require("../../../../locators/apiWidgetslocator.json");
const dsl = require("../../../../fixtures/inputWidgetDsl.json");
const commonlocators = require("../../../../locators/commonlocators.json");
const widgetsPage = require("../../../../locators/Widgets.json");
const testdata = require("../../../../fixtures/testdata.json");
const publish = require("../../../../locators/publishWidgetspage.json");




describe("Test curl import flow", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Test curl import flow for POST action", function() {
    localStorage.setItem("ApiPaneV2", "ApiPaneV2");
    cy.NavigateToApiEditor();
    cy.get(ApiEditor.curlImage).click({ force: true });
    cy.get("textarea").type(
      'curl -d \'{\n{{"name"}}:{{"morpheus"}},\n{{"job"}}:{{"leader"}}\n}\' -H Content-Type:application/json -X POST https://mock-api.appsmith.com/echo/post',
      {
        force: true,
        parseSpecialCharSequences: false,
      },
    );
    cy.importCurl();
    cy.get(".react-tabs__tab")
      .contains("Settings")
      .click({ force: true });
    cy.get(
      '[data-cy="actionConfiguration.pluginSpecifiedTemplates[0].value"] > input',
    ).click({ force: true });
    cy.RunAPI();
    cy.ResponseStatusCheck("201 CREATED");
    cy.get("@curlImport").then((response) => {
      cy.expect(response.response.body.responseMeta.success).to.eq(true);
      cy.get(apiwidget.ApiName)
        .invoke("text")
        .then((text) => {
          const someText = text;
          expect(someText).to.equal(response.response.body.data.name);
        });
    });
    cy.ResponseTextCheck(testdata.postUrlCurl);
  });

  it("Input widget test with default value from table widget", function() {
    cy.SearchEntityandOpen("Input1");
    cy.wait(1000);
    cy.get(widgetsPage.defaultInput).type("{{Api1.data.headers");
    cy.get(commonlocators.editPropCrossButton).click({ force: true });
    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
  });

  it("publish widget and validate the data displayed in input widgets value for CURL response", function() {
    cy.PublishtheApp();
    cy.get(publish.inputWidget + " " + "input")
      .first()
      .invoke("attr", "value")
      .should("contain", testdata.host);
  });
  
});
