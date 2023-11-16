import {
  agHelper,
  entityExplorer,
  entityItems,
  dataSources,
  assertHelper,
} from "../../../support/Objects/ObjectsCore";
let dsName: any;
import formControls from "../../../locators/FormControl.json";
import EditorNavigation, {
  SidebarButton,
} from "../../../support/Pages/EditorNavigation";

describe(
  "excludeForAirgap",
  "Validate Mock Query Active Ds querying & count",
  () => {
    it("1. Create Query from Mock Postgres DB & verify active queries count", () => {
      dataSources.CreateMockDB("Users").then((mockDBName) => {
        dsName = mockDBName;
        cy.log("Mock DB Name: " + mockDBName);

        assertHelper.AssertNetworkStatus("@getDatasourceStructure", 200);
        dataSources.CreateQueryAfterDSSaved();

        // This will validate that query populated in editor uses existing table name
        agHelper.VerifyCodeInputValue(
          formControls.postgreSqlBody,
          'SELECT * FROM public."users" LIMIT 10;',
        );

        dataSources.RunQueryNVerifyResponseViews(5); //minimum 5 rows are expected
        EditorNavigation.ViaSidebar(SidebarButton.Data);
        dataSources
          .getDatasourceListItemDescription(mockDBName)
          .then(($queryCount) =>
            expect($queryCount).to.eq("1 queries in this app"),
          );

        entityExplorer.CreateNewDsQuery(mockDBName);
        dataSources.RunQueryNVerifyResponseViews(10, true);
        EditorNavigation.ViaSidebar(SidebarButton.Data);
        dataSources
          .getDatasourceListItemDescription(mockDBName)
          .then(($queryCount) =>
            expect($queryCount).to.eq("2 queries in this app"),
          );
      });
    });

    it("2. Create Query from Mock Mongo DB & verify active queries count", () => {
      dataSources.CreateMockDB("Movies").then((mockDBName) => {
        dsName = mockDBName;
        cy.log("Mock DB Name: " + mockDBName);

        // delay is introduced so that structure fetch is complete before moving to query creation
        // feat: #25320, new query created for mock db movies, will be populated with default values
        agHelper.Sleep(500);

        assertHelper.AssertNetworkStatus("@getDatasourceStructure", 200);
        dataSources.CreateQueryAfterDSSaved();

        assertHelper.AssertNetworkStatus("@trigger");
        dataSources.ValidateNSelectDropdown("Commands", "Find document(s)");
        agHelper.Sleep(2000); //for movies collection to load & populate in dropdown
        dataSources.ValidateNSelectDropdown("Collection", "movies");
        dataSources.RunQueryNVerifyResponseViews(1, false);
        EditorNavigation.ViaSidebar(SidebarButton.Data);
        dataSources
          .getDatasourceListItemDescription(mockDBName)
          .then(($queryCount) =>
            expect($queryCount).to.eq("1 queries in this app"),
          );

        entityExplorer.CreateNewDsQuery(mockDBName);
        dataSources.ValidateNSelectDropdown("Commands", "Find document(s)");
        dataSources.ValidateNSelectDropdown("Collection", "movies");
        dataSources.RunQueryNVerifyResponseViews(1, false);
        EditorNavigation.ViaSidebar(SidebarButton.Data);
        dataSources
          .getDatasourceListItemDescription(mockDBName)
          .then(($queryCount) =>
            expect($queryCount).to.eq("2 queries in this app"),
          );
      });
    });

    afterEach(() => {
      EditorNavigation.ViaSidebar(SidebarButton.Pages);
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
      EditorNavigation.ViaSidebar(SidebarButton.Data);
      dataSources
        .getDatasourceListItemDescription(dsName)
        .then(($queryCount) =>
          expect($queryCount).to.eq("No queries in this app"),
        );
      dataSources.DeleteDatasourceFromWithinDS(dsName);
    });
  },
);
