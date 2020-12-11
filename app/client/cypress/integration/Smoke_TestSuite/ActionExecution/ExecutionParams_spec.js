const dsl = require("../../../fixtures/tableWidgetDsl.json");
const publishPage = require("../../../locators/publishWidgetspage.json");

describe("API Panel Test Functionality", function() {
  before(() => {
    cy.addDsl(dsl);
  });
  it("Will load an api on load", function() {
    cy.NavigateToAPI_Panel();
    cy.CreateAPI("MultiApi");
    cy.enterDatasourceAndPath(
      "https://jsonplaceholder.typicode.com/",
      "{{this.params.endpoint}}",
    );
    cy.WaitAutoSave();

    cy.SearchEntityandOpen("Table1");
    cy.testJsontext("tabledata", "{{MultiApi.data");

    cy.SearchEntityandOpen("RunButton");
    cy.get(".t--property-control-onclick")
      .find(".t--js-toggle")
      .click();

    cy.testJsontext(
      "onclick",
      "{{MultiApi.run(undefined, undefined, { endpoint: 'users",
    );
    cy.get(publishPage.buttonWidget).click();
    cy.pause();
  });

  // it("Will not crash the app for failure", function() {
  //   cy.SearchEntityandOpen("PageLoadApi");
  //   cy.get("li:contains('Settings')").click({ force: true });
  //   cy.get("[data-cy='actionConfiguration.timeoutInMillisecond']")
  //     .find(".bp3-input")
  //     .type("{backspace}{backspace}{backspace}");
  //
  //   cy.NavigateToAPI_Panel();
  //   cy.CreateAPI("NormalApi");
  //   cy.enterDatasourceAndPath("https://reqres.in/api/", "users");
  //   cy.WaitAutoSave();
  //
  //   cy.reload();
  //   cy.wait("@postExecute");
  //   cy.RunAPI();
  //   cy.ResponseStatusCheck("200 OK");
  // });
});
