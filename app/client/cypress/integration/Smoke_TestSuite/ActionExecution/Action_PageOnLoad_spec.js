const dsl = require("../../../fixtures/tableWidgetDsl.json");

describe("API Panel Test Functionality", function() {
  before(() => {
    cy.addDsl(dsl);
  });
  it("Will load an api on load", function() {
    cy.NavigateToAPI_Panel();
    cy.CreateAPI("PageLoadApi");
    cy.enterDatasourceAndPath("https://reqres.in/api/", "users");
    cy.WaitAutoSave();
    cy.get("li:contains('Settings')").click({ force: true });
    cy.get("[data-cy=executeOnLoad]")
      .find(".bp3-switch")
      .click();

    cy.wait("@setExecuteOnLoad");

    cy.SearchEntityandOpen("Table1");
    cy.testJsontext("tabledata", "{{PageLoadApi.data.data");

    cy.wait("@updateLayout");

    cy.reload();
    cy.wait("@postExecute").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
  });

  it("Will not crash the app for failure", function() {
    cy.SearchEntityandOpen("PageLoadApi");
    cy.get("li:contains('Settings')").click({ force: true });
    cy.get("[data-cy='actionConfiguration.timeoutInMillisecond']")
      .find(".bp3-input")
      .type("{backspace}{backspace}{backspace}");

    cy.NavigateToAPI_Panel();
    cy.CreateAPI("NormalApi");
    cy.enterDatasourceAndPath("https://reqres.in/api/", "users");
    cy.WaitAutoSave();

    cy.reload();
    cy.wait("@postExecute");
    cy.RunAPI();
    cy.ResponseStatusCheck("200 OK");
  });
});
