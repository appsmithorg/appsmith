import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const TAB_MIN_HEIGHT = 36;

const apiPage = ObjectsRegistry.ApiPage;
const jsEditor = ObjectsRegistry.JSEditor;
const debuggerHelper = ObjectsRegistry.Debugger;
const dataSources = ObjectsRegistry.DataSources;
const agHelper = ObjectsRegistry.AggregateHelper;
let entityExplorer = ObjectsRegistry.EntityExplorer;

describe("Debugger bottom bar", () => {
  it("should be closable", () => {
    debuggerHelper.OpenDebugger();
    cy.get(debuggerHelper._debuggerTabsContainer).should("exist");
    debuggerHelper.CloseDebugger();
    cy.get(debuggerHelper._debuggerTabsContainer).should("not.exist");
  });
});

describe("Api bottom bar", () => {
  it("should be collapsable", () => {
    apiPage.CreateApi();
    apiPage.ToggleResponsePane();
    cy.get(apiPage._bottomPaneContainer)
      .invoke("height")
      .should("be.equal", TAB_MIN_HEIGHT);
    apiPage.ToggleResponsePane();
    cy.get(apiPage._bottomPaneContainer)
      .invoke("height")
      .should("be.equal", (Cypress.config().viewportHeight * 32) / 100);
  });
});

describe("JsEditor bottom bar", () => {
  it("should be collapsable", () => {
    jsEditor.CreateJSObject();
    jsEditor.ToggleResponsePane();
    cy.get(jsEditor._bottomPaneContainer)
      .invoke("height")
      .should("be.equal", TAB_MIN_HEIGHT);
    jsEditor.ToggleResponsePane();
    cy.get(jsEditor._bottomPaneContainer)
      .invoke("height")
      .should("be.equal", (Cypress.config().viewportHeight * 32) / 100);
  });
});

describe("Query bottom bar", () => {
  let mockDBNameUsers;
  it("should be collapsable", () => {
    dataSources.NavigateToDSCreateNew();
    agHelper.GetNClick(dataSources._mockDB("Users"));
    cy.wait("@getMockDb").then(($createdMock) => {
      mockDBNameUsers = $createdMock.response?.body.data.name;
      dataSources.CreateQuery(mockDBNameUsers);
      dataSources.ToggleResponsePane();
      cy.get(dataSources._bottomPaneContainer)
        .invoke("height")
        .should("be.equal", TAB_MIN_HEIGHT - 1); // -1 added to offset error
      dataSources.ToggleResponsePane();
      cy.get(dataSources._bottomPaneContainer)
        .invoke("height")
        .should("be.equal", (Cypress.config().viewportHeight * 32) / 100 - 1); // -1 added to offset error
    });
  });
  after(() => {
    entityExplorer.ExpandCollapseEntity("Queries/JS");
    entityExplorer.ActionContextMenuByEntityName(
      "Query1",
      "Delete",
      "Are you sure?",
    );
    dataSources.DeleteDatasouceFromActiveTab(mockDBNameUsers);
  });
});
