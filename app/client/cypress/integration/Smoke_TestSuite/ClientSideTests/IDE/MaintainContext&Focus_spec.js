const homePage = require("../../../../locators/HomePage");
const widgetLocators = require("../../../../locators/Widgets.json");
const explorer = require("../../../../locators/explorerlocators.json");
const apiwidget = require("../../../../locators/apiWidgetslocator.json");

describe("MaintainContext&Focus", function() {
  it("Import the test application", () => {
    // TODO
    // Temp search app
    cy.get(homePage.homeIcon).click({ force: true });
    cy.SearchApp("ContextSwitching");
    cy.get("#loading").should("not.exist");
  });
  it("Focus on different entities", () => {
    cy.CheckAndUnfoldEntityItem("Queries/JS");

    cy.SearchEntityandOpen("Text1");
    cy.focusCodeInput(".t--property-control-text", { line: 0, ch: 3 });

    cy.SearchEntityandOpen("Graphql_Query");
    cy.contains(".react-tabs__tab", "Body").click();
    cy.focusCodeInput(".t--graphql-query-editor", { line: 1, ch: 10 });

    cy.SearchEntityandOpen("Rest_Api_1");
    cy.wait(1000);
    cy.get('[data-cy="t--tab-PARAMS"]').click();
    cy.focusCodeInput(apiwidget.queryKey, {
      line: 0,
      ch: 2,
    });

    cy.SearchEntityandOpen("Rest_Api_2");
    cy.wait(1000);
    cy.contains(".react-tabs__tab", "Headers").click();
    cy.updateCodeInput(apiwidget.headerValue, "test");

    cy.SearchEntityandOpen("S3_Query");
    cy.wait(1000);
    cy.focusCodeInput(".t--actionConfiguration.formData.bucket.data", {
      line: 0,
      ch: 1,
    });

    cy.SearchEntityandOpen("SQL_Query");
    cy.wait(1000);
    cy.focusCodeInput(".t--actionConfiguration.body", {
      line: 0,
      ch: 10,
    });

    cy.SearchEntityandOpen("JSObject1");
    cy.wait(1000);
    cy.focusCodeInput(".js-editor", {
      line: 5,
      ch: 4,
    });

    cy.SearchEntityandOpen("JSObject2");
    cy.wait(1000);
    cy.focusCodeInput(".js-editor", {
      line: 2,
      ch: 3,
    });

    cy.SearchEntityandOpen("Mongo_Query");
    cy.wait(1000);
    cy.updateCodeInput(
      ".t--actionConfiguration.formData.collection.data",
      "TestCollection",
    );
  });
  it("Check for focus on entities", () => {
    cy.get(`.t--entity-name:contains("Page1")`).click();

    cy.get(".t--widget-name").should("have.text", "Text1");
    cy.assertCursorOnCodeInput(".t--property-control-text", {
      ch: 3,
      line: 0,
    });

    cy.SearchEntityandOpen("Graphql_Query");
    cy.contains(".react-tabs__tab", "Body").should(
      "have.class",
      "react-tabs__tab--selected",
    );
    cy.assertCursorOnCodeInput(".t--graphql-query-editor", {
      line: 1,
      ch: 10,
    });

    cy.SearchEntityandOpen("Rest_Api_1");
    cy.assertCursorOnCodeInput(
      ".t--actionConfiguration.queryParameters[0].value.0",
      {
        line: 0,
        ch: 4,
      },
    );

    cy.SearchEntityandOpen("Rest_Api_2");
    cy.contains(".react-tabs__tab", "Headers").should(
      "have.class",
      "react-tabs__tab--selected",
    );
    cy.assertCursorOnCodeInput(".t--actionConfiguration.headers[0].key.0", {
      line: 0,
      ch: 2,
    });

    cy.SearchEntityandOpen("S3_Query");
    cy.assertCursorOnCodeInput(".t--actionConfiguration.formData.bucket.data", {
      line: 0,
      ch: 2,
    });

    cy.SearchEntityandOpen("SQL_Query");
    cy.assertCursorOnCodeInput(".t--actionConfiguration.body", {
      line: 0,
      ch: 10,
    });

    cy.SearchEntityandOpen("JSObject1");
    cy.assertCursorOnCodeInput(".js-editor", {
      line: 5,
      ch: 4,
    });

    cy.SearchEntityandOpen("JSObject2");
    cy.assertCursorOnCodeInput(".js-editor", {
      line: 2,
      ch: 3,
    });

    cy.SearchEntityandOpen("Mongo_Query");
    cy.assertCursorOnCodeInput(
      ".t--actionConfiguration.formData.collection.data",
      {
        line: 0,
        ch: 14,
      },
    );
  });
});
