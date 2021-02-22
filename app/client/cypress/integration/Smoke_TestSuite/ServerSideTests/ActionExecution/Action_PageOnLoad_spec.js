const dsl = require("../../../../fixtures/tableWidgetDsl.json");
const commonlocators = require("../../../../locators/commonlocators.json");
const testdata = require("../../../../fixtures/testdata.json");

describe("API Panel Test Functionality", function() {
  before(() => {
    cy.addDsl(dsl);
  });
  it("Will load an api on load", function() {
    cy.NavigateToAPI_Panel();
    cy.CreateAPI("PageLoadApi");
    cy.enterDatasourceAndPath(testdata.baseUrl, testdata.methods);
    cy.WaitAutoSave();
    cy.get("li:contains('Settings')").click({ force: true });
    cy.get("[data-cy=executeOnLoad]").click({ force: true });

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

  it("Shows which action failed on action fail.", function() {
    cy.NavigateToAPI_Panel();
    cy.CreateAPI("PageLoadApi2");
    cy.enterDatasourceAndPath("https://abc.com", "users");
    cy.WaitAutoSave();
    cy.get("li:contains('Settings')").click({ force: true });
    cy.get("[data-cy=executeOnLoad]").click({ force: true });

    cy.wait("@setExecuteOnLoad");

    cy.SearchEntityandOpen("Table1");
    cy.testJsontext("tabledata", "{{PageLoadApi2.data.data");

    cy.wait("@updateLayout");

    cy.reload();
    cy.get(commonlocators.toastMsg).contains(
      `The action "PageLoadApi2" has failed.`,
    );
  });
});
