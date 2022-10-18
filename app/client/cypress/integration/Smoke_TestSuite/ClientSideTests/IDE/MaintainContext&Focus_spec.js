import reconnectDatasourceModal from "../../../../locators/ReconnectLocators";
const apiwidget = require("../../../../locators/apiWidgetslocator.json");
import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const homePage = ObjectsRegistry.HomePage;
const agHelper = ObjectsRegistry.AggregateHelper;

describe("MaintainContext&Focus", function() {
  it("Import the test application", () => {
    homePage.NavigateToHome();
    cy.intercept("GET", "/api/v1/users/features", {
      fixture: "featureFlags.json",
    }).as("featureFlags");
    cy.reload();
    homePage.ImportApp("ContextSwitching.json");
    cy.wait("@importNewApplication").then((interception) => {
      agHelper.Sleep();
      const { isPartialImport } = interception.response.body.data;
      if (isPartialImport) {
        // should reconnect modal
        cy.get(reconnectDatasourceModal.SkipToAppBtn).click({
          force: true,
        });
        cy.wait(2000);
      } else {
        homePage.AssertImportToast();
      }
    });
  });
  it("Focus on different entities", () => {
    cy.CheckAndUnfoldEntityItem("Queries/JS");

    cy.SearchEntityandOpen("Text1");
    cy.focusCodeInput(".t--property-control-text");

    cy.SearchEntityandOpen("Graphql_Query");
    cy.focusCodeInput(".t--graphql-query-editor");

    cy.SearchEntityandOpen("Rest_Api_1");
    cy.wait(1000);
    cy.get('[data-cy="t--tab-PARAMS"]').click();
    cy.focusCodeInput(apiwidget.queryKey);
    cy.wait("@saveAction");

    cy.SearchEntityandOpen("Rest_Api_2");
    cy.wait(1000);
    cy.contains(".react-tabs__tab", "Headers").click();
    cy.updateCodeInput(apiwidget.headerValue, "test");
    cy.wait("@saveAction");

    cy.SearchEntityandOpen("SQL_Query");
    cy.wait(1000);
    cy.focusCodeInput(".t--actionConfiguration\\.body");
    cy.wait("@saveAction");

    cy.SearchEntityandOpen("S3_Query");
    cy.wait(1000);
    cy.focusCodeInput(".t--actionConfiguration\\.formData\\.bucket\\.data");
    cy.wait(1000);
    cy.wait("@saveAction");

    cy.SearchEntityandOpen("JSObject1");
    cy.wait(1000);
    cy.focusCodeInput(".js-editor");
    cy.wait("@saveAction");

    cy.SearchEntityandOpen("JSObject2");
    cy.wait(1000);
    cy.focusCodeInput(".js-editor");

    cy.SearchEntityandOpen("Mongo_Query");
    cy.wait(1000);
    cy.updateCodeInput(
      ".t--actionConfiguration\\.formData\\.collection\\.data",
      "TestCollection",
    );
    cy.wait("@saveAction");
  });
  it("Check for focus on entities", () => {
    cy.get(`.t--entity-name:contains("Page1")`).click();

    cy.get(".t--widget-name").should("have.text", "Text1");
    cy.assertCursorOnCodeInput(".t--property-control-text");

    cy.SearchEntityandOpen("Graphql_Query");
    cy.contains(".react-tabs__tab", "Body").should(
      "have.class",
      "react-tabs__tab--selected",
    );
    cy.assertCursorOnCodeInput(".t--graphql-query-editor");

    cy.SearchEntityandOpen("Rest_Api_1");
    cy.assertCursorOnCodeInput(apiwidget.queryKey);

    cy.SearchEntityandOpen("Rest_Api_2");
    cy.contains(".react-tabs__tab", "Headers").should(
      "have.class",
      "react-tabs__tab--selected",
    );
    cy.assertCursorOnCodeInput(apiwidget.headerValue);

    cy.SearchEntityandOpen("SQL_Query");
    cy.assertCursorOnCodeInput(".t--actionConfiguration\\.body");

    cy.SearchEntityandOpen("S3_Query");
    cy.assertCursorOnCodeInput(
      ".t--actionConfiguration\\.formData\\.bucket\\.data",
    );

    cy.SearchEntityandOpen("JSObject1");
    cy.assertCursorOnCodeInput(".js-editor");

    cy.SearchEntityandOpen("JSObject2");
    cy.assertCursorOnCodeInput(".js-editor");

    cy.SearchEntityandOpen("Mongo_Query");
    cy.assertCursorOnCodeInput(
      ".t--actionConfiguration\\.formData\\.collection\\.data",
    );
  });
});
