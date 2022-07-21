import { ObjectsRegistry } from "../../../../support/Objects/Registry";

let agHelper = ObjectsRegistry.AggregateHelper,
  ee = ObjectsRegistry.EntityExplorer,
  dataSources = ObjectsRegistry.DataSources;

describe("Validate Mock Query Active Ds querying & count", () => {

  it("1. Create Query from Mock Mongo DB & verify active queries count", () => {
    dataSources.NavigateToDSCreateNew();
    agHelper.GetNClick(dataSources._mockDB("Movies"));
    dataSources.CreateQuery("Movies");
    dataSources.ValidateNSelectDropdown("Commands", "Find Document(s)");
    agHelper.EnterValue("movies", {
      propFieldName: "",
      directInput: false,
      inputFieldName: "Collection",
    });
    dataSources.RunQueryNVerifyResponseViews(10, false);
    dataSources.NavigateToActiveTab();
    agHelper
      .GetText(dataSources._queriesOnPageText("Movies"))
      .then(($queryCount) => expect($queryCount).to.eq("1 query on this page"));

    ee.CreateNewDsQuery("Movies");
    dataSources.ValidateNSelectDropdown("Commands", "Find Document(s)");
    agHelper.EnterValue("movies", {
      propFieldName: "",
      directInput: false,
      inputFieldName: "Collection",
    });
    dataSources.RunQueryNVerifyResponseViews(10, false);
    dataSources.NavigateToActiveTab();
    agHelper
      .GetText(dataSources._queriesOnPageText("Movies"))
      .then(($queryCount) =>
        expect($queryCount).to.eq("2 queries on this page"),
      );

    ee.ExpandCollapseEntity("QUERIES/JS");
    ee.ActionContextMenuByEntityName("Query1", "Delete", "Are you sure?");
    ee.ActionContextMenuByEntityName("Query2", "Delete", "Are you sure?");
    dataSources.NavigateToActiveTab();
    agHelper
    .GetText(dataSources._queriesOnPageText("Movies"))
    .then(($queryCount) =>
      expect($queryCount).to.eq("No query in this application is using this datasource"),
    );
    dataSources.DeleteDatasouceFromActiveTab("Movies");
  });

  it("2. Create Query from Mock Postgres DB & verify active queries count", () => {
    dataSources.NavigateToDSCreateNew();
    agHelper.GetNClick(dataSources._mockDB("Users"));
    dataSources.CreateQuery("Users");
    agHelper.GetNClick(dataSources._templateMenuOption('Select'));
    dataSources.RunQueryNVerifyResponseViews(10);
    dataSources.NavigateToActiveTab();
    agHelper
      .GetText(dataSources._queriesOnPageText("Users"))
      .then(($queryCount) => expect($queryCount).to.eq("1 query on this page"));

    ee.CreateNewDsQuery("Users");
    agHelper.GetNClick(dataSources._templateMenuOption('Select'));
    dataSources.RunQueryNVerifyResponseViews(10, false);
    dataSources.NavigateToActiveTab();
    agHelper
      .GetText(dataSources._queriesOnPageText("Users"))
      .then(($queryCount) =>
        expect($queryCount).to.eq("2 queries on this page"),
      );

    ee.ExpandCollapseEntity("QUERIES/JS");
    ee.ActionContextMenuByEntityName("Query1", "Delete", "Are you sure?");
    ee.ActionContextMenuByEntityName("Query2", "Delete", "Are you sure?");
    dataSources.NavigateToActiveTab();
    agHelper
    .GetText(dataSources._queriesOnPageText("Users"))
    .then(($queryCount) =>
      expect($queryCount).to.eq("No query in this application is using this datasource"),
    );
    dataSources.DeleteDatasouceFromActiveTab("Users");
  });
});
