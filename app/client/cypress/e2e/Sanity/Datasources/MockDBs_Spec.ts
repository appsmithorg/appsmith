import {
  agHelper,
  entityExplorer,
  entityItems,
  dataSources,
} from "../../../support/Objects/ObjectsCore";
let dsName: any;

describe(
  "excludeForAirgap",
  "Validate Mock Query Active Ds querying & count",
  () => {
    it("1. Create Query from Mock Mongo DB & verify active queries count", () => {
      dataSources.CreateMockDB("Movies").then((mockDBName) => {
        dsName = mockDBName;
        dataSources.CreateQueryFromActiveTab(mockDBName, false);
        dataSources.ValidateNSelectDropdown("Commands", "Find document(s)");
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

        entityExplorer.CreateNewDsQuery(mockDBName);
        dataSources.ValidateNSelectDropdown("Commands", "Find document(s)");
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
      });
    });

    it("2. Create Query from Mock Postgres DB & verify active queries count", () => {
      dataSources.CreateMockDB("Users").then((mockDBName) => {
        dsName = mockDBName;
        dataSources.CreateQueryFromActiveTab(mockDBName, false);
        agHelper.GetNClick(dataSources._templateMenuOption("Select"));
        dataSources.RunQueryNVerifyResponseViews(10);
        dataSources.NavigateToActiveTab();
        agHelper
          .GetText(dataSources._queriesOnPageText(mockDBName))
          .then(($queryCount) =>
            expect($queryCount).to.eq("1 query on this page"),
          );

        entityExplorer.CreateNewDsQuery(mockDBName);
        agHelper.GetNClick(dataSources._templateMenuOption("Select"));
        dataSources.RunQueryNVerifyResponseViews(10, false);
        dataSources.NavigateToActiveTab();
        agHelper
          .GetText(dataSources._queriesOnPageText(mockDBName))
          .then(($queryCount) =>
            expect($queryCount).to.eq("2 queries on this page"),
          );
      });
    });

    afterEach(() => {
      entityExplorer.ExpandCollapseEntity("Queries/JS");
      entityExplorer.ActionContextMenuByEntityName({
        entityNameinLeftSidebar: "Query1",
        action: "Delete",
        entityType: entityItems.Query,
      });
      entityExplorer.ActionContextMenuByEntityName({
        entityNameinLeftSidebar: "Query2",
        action: "Delete",
        entityType: entityItems.Query,
      });
      dataSources.NavigateToActiveTab();
      agHelper
        .GetText(dataSources._queriesOnPageText(dsName))
        .then(($queryCount) =>
          expect($queryCount).to.eq(
            "No query in this application is using this datasource",
          ),
        );
      dataSources.DeleteDatasouceFromActiveTab(dsName);
    });
  },
);
