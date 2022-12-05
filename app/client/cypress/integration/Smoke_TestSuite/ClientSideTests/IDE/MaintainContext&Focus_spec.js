import reconnectDatasourceModal from "../../../../locators/ReconnectLocators";
const apiwidget = require("../../../../locators/apiWidgetslocator.json");
import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const homePage = ObjectsRegistry.HomePage;
const agHelper = ObjectsRegistry.AggregateHelper;
const dataSources = ObjectsRegistry.DataSources;
const ee = ObjectsRegistry.EntityExplorer;
const apiPage = ObjectsRegistry.ApiPage;

describe("MaintainContext&Focus", function() {
  it("1. Import the test application", () => {
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

  it("2. Focus on different entities", () => {
    cy.CheckAndUnfoldEntityItem("Queries/JS");

    cy.SearchEntityandOpen("Text1");
    cy.focusCodeInput(".t--property-control-text", { ch: 2, line: 0 });

    cy.SearchEntityandOpen("Graphql_Query");
    cy.focusCodeInput(".t--graphql-query-editor", { ch: 4, line: 1 });

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
    cy.focusCodeInput(".t--actionConfiguration\\.body", { ch: 5, line: 0 });
    cy.wait("@saveAction");

    cy.SearchEntityandOpen("S3_Query");
    cy.wait(1000);
    cy.focusCodeInput(".t--actionConfiguration\\.formData\\.bucket\\.data", {
      ch: 2,
      line: 0,
    });
    cy.wait(1000);
    cy.wait("@saveAction");

    cy.SearchEntityandOpen("JSObject1");
    cy.wait(1000);
    cy.focusCodeInput(".js-editor", { ch: 4, line: 4 });
    cy.wait("@saveAction");

    cy.SearchEntityandOpen("JSObject2");
    cy.wait(1000);
    cy.focusCodeInput(".js-editor", { ch: 2, line: 2 });

    cy.SearchEntityandOpen("Mongo_Query");
    cy.wait(1000);
    cy.updateCodeInput(
      ".t--actionConfiguration\\.formData\\.collection\\.data",
      "TestCollection",
    );
    cy.wait("@saveAction");
  });

  it("3. Maintains focus on the property pane", () => {
    cy.get(`.t--entity-name:contains("Page1")`).click();

    cy.get(".t--widget-name").should("have.text", "Text1");
    cy.assertSoftFocusOnPropertyPane(".t--property-control-text", {
      ch: 2,
      line: 0,
    });
  });

  it("4. Maintains focus on Api Pane", () => {
    cy.SearchEntityandOpen("Graphql_Query");
    cy.contains(".react-tabs__tab", "Body").should(
      "have.class",
      "react-tabs__tab--selected",
    );
    cy.assertCursorOnCodeInput(".t--graphql-query-editor", { ch: 4, line: 1 });

    cy.SearchEntityandOpen("Rest_Api_1");
    cy.assertCursorOnCodeInput(apiwidget.queryKey);

    cy.SearchEntityandOpen("Rest_Api_2");
    cy.contains(".react-tabs__tab", "Headers").should(
      "have.class",
      "react-tabs__tab--selected",
    );
    cy.assertCursorOnCodeInput(apiwidget.headerValue);
  });

  it("5. Maintains focus on Query panes", () => {
    cy.SearchEntityandOpen("SQL_Query");
    cy.assertCursorOnCodeInput(".t--actionConfiguration\\.body", {
      ch: 5,
      line: 0,
    });

    cy.SearchEntityandOpen("S3_Query");
    cy.assertCursorOnCodeInput(
      ".t--actionConfiguration\\.formData\\.bucket\\.data",
      { ch: 2, line: 0 },
    );
    cy.SearchEntityandOpen("Mongo_Query");
    cy.assertCursorOnCodeInput(
      ".t--actionConfiguration\\.formData\\.collection\\.data",
    );
  });

  it("6. Maintains focus on JS Objects", () => {
    cy.SearchEntityandOpen("JSObject1");
    cy.assertCursorOnCodeInput(".js-editor", { ch: 4, line: 4 });

    cy.SearchEntityandOpen("JSObject2");
    cy.assertCursorOnCodeInput(".js-editor", { ch: 2, line: 2 });
  });

  it("7. Check if selected tab on right tab persists", () => {
    ee.SelectEntityByName("Rest_Api_1");
    apiPage.SelectRightPaneTab("connections");
    ee.SelectEntityByName("SQL_Query");
    ee.SelectEntityByName("Rest_Api_1");
    apiPage.AssertRightPaneSelectedTab("connections");
  });

  it("8. Datasource edit mode has to be maintained", () => {
    ee.SelectEntityByName("Appsmith");
    dataSources.EditDatasource();
    dataSources.SaveDSFromDialog(false);
    ee.SelectEntityByName("Github");
    dataSources.AssertViewMode();
    ee.SelectEntityByName("Appsmith");
    dataSources.AssertEditMode();
  });

  it("9. Datasource collapse state has to be maintained", () => {
    // Create datasource 1
    dataSources.SaveDSFromDialog(false);
    dataSources.NavigateToDSCreateNew();
    dataSources.CreatePlugIn("PostgreSQL");
    agHelper.RenameWithInPane("Postgres1", false);
    // Expand section with index 1
    dataSources.ExpandSection(1);
    // Create and switch to datasource 2
    dataSources.SaveDSFromDialog(true);
    dataSources.NavigateToDSCreateNew();
    dataSources.CreatePlugIn("MongoDB");
    agHelper.RenameWithInPane("Mongo1", false);
    // Validate if section with index 1 is collapsed
    dataSources.AssertSectionCollapseState(1, false);
    // Switch back to datasource 1
    dataSources.SaveDSFromDialog(false);
    dataSources.CreateNewQueryInDS("Postgres1");
    ee.SelectEntityByName("Postgres1");
    dataSources.EditDatasource();
    // Validate if section with index 1 is expanded
    dataSources.AssertSectionCollapseState(1, false);
  });
});
