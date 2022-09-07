import { ObjectsRegistry } from "../../../../support/Objects/Registry";

let agHelper = ObjectsRegistry.AggregateHelper,
  ee = ObjectsRegistry.EntityExplorer,
  dataSources = ObjectsRegistry.DataSources;
let mockDBName: any;

describe("Validate Mock Query Active Ds querying & count", () => {
  it("1. Create Query from Mock Mongo DB & verify active queries count", () => {
    dataSources.NavigateToDSCreateNew();
    agHelper.GetNClick(dataSources._mockDB("Movies"));
    cy.wait("@getMockDb").then(($createdMock) => {
      mockDBName = $createdMock.response?.body.data.name;

      dataSources.CreateQuery(mockDBName);
      dataSources.ValidateNSelectDropdown("Commands", "Find Document(s)");
      agHelper.EnterValue("movies", {
        propFieldName: "",
        directInput: false,
        inputFieldName: "Collection",
      });
      dataSources.RunQueryNVerifyResponseViews(10, false);
      dataSources.NavigateToActiveTab();
      agHelper
        .GetText(dataSources._queriesOnPageText(mockDBName))
        .then(($queryCount) =>
          expect($queryCount).to.eq("1 query on this page"),
        );

      ee.CreateNewDsQuery(mockDBName);
      dataSources.ValidateNSelectDropdown("Commands", "Find Document(s)");
      agHelper.EnterValue("movies", {
        propFieldName: "",
        directInput: false,
        inputFieldName: "Collection",
      });
      dataSources.RunQueryNVerifyResponseViews(10, false);
      dataSources.NavigateToActiveTab();
      agHelper
        .GetText(dataSources._queriesOnPageText(mockDBName))
        .then(($queryCount) =>
          expect($queryCount).to.eq("2 queries on this page"),
        );

      ee.ExpandCollapseEntity("QUERIES/JS");
      ee.ActionContextMenuByEntityName("Query1", "Delete", "Are you sure?");
      ee.ActionContextMenuByEntityName("Query2", "Delete", "Are you sure?");
      dataSources.NavigateToActiveTab();
      agHelper
        .GetText(dataSources._queriesOnPageText(mockDBName))
        .then(($queryCount) =>
          expect($queryCount).to.eq(
            "No query in this application is using this datasource",
          ),
        );
      dataSources.DeleteDatasouceFromActiveTab(mockDBName);
    });
  });

  it("2. Create Query from Mock Postgres DB & verify active queries count", () => {
    dataSources.NavigateToDSCreateNew();
    agHelper.GetNClick(dataSources._mockDB("Users"));

    cy.wait("@getMockDb").then(($createdMock) => {
      mockDBName = $createdMock.response?.body.data.name;
      dataSources.CreateQuery(mockDBName);
      agHelper.GetNClick(dataSources._templateMenuOption("Select"));
      dataSources.RunQueryNVerifyResponseViews(10);
      dataSources.NavigateToActiveTab();
      agHelper
        .GetText(dataSources._queriesOnPageText(mockDBName))
        .then(($queryCount) =>
          expect($queryCount).to.eq("1 query on this page"),
        );

      ee.CreateNewDsQuery(mockDBName);
      agHelper.GetNClick(dataSources._templateMenuOption("Select"));
      dataSources.RunQueryNVerifyResponseViews(10, false);
      dataSources.NavigateToActiveTab();
      agHelper
        .GetText(dataSources._queriesOnPageText(mockDBName))
        .then(($queryCount) =>
          expect($queryCount).to.eq("2 queries on this page"),
        );

      ee.ExpandCollapseEntity("QUERIES/JS");
      ee.ActionContextMenuByEntityName("Query1", "Delete", "Are you sure?");
      ee.ActionContextMenuByEntityName("Query2", "Delete", "Are you sure?");
      dataSources.NavigateToActiveTab();
      agHelper
        .GetText(dataSources._queriesOnPageText(mockDBName))
        .then(($queryCount) =>
          expect($queryCount).to.eq(
            "No query in this application is using this datasource",
          ),
        );
      dataSources.DeleteDatasouceFromActiveTab(mockDBName);
    });
  });
});
