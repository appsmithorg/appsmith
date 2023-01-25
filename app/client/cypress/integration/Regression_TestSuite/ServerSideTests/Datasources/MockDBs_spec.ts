import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const agHelper = ObjectsRegistry.AggregateHelper,
  ee = ObjectsRegistry.EntityExplorer,
  dataSources = ObjectsRegistry.DataSources;

describe("Validate Mock Query Active Ds querying & count", () => {
  it("1. Create Query from Mock Mongo DB & verify active queries count", () => {
    dataSources.CreateMockDB("Movies").then((mockDBName) => {
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

      ee.ExpandCollapseEntity("Queries/JS");
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
    dataSources.CreateMockDB("Users").then((mockDBName) => {
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

      ee.ExpandCollapseEntity("Queries/JS");
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
