import {
  agHelper,
  entityExplorer,
  entityItems,
  dataSources,
  assertHelper,
} from "../../../support/Objects/ObjectsCore";
let dsName: any;
import formControls from "../../../locators/FormControl.json";
import {
  AppSidebar,
  AppSidebarButton,
  PageLeftPane,
  PagePaneSegment,
} from "../../../support/Pages/EditorNavigation";
import PageList from "../../../support/Pages/PageList";

describe(
  "Validate Mock Query Active Ds querying & count",
  {
    tags: [
      "@tag.Datasource",
      "@tag.excludeForAirgap",
      "@tag.Git",
      "@tag.AccessControl",
    ],
  },
  () => {
    it("1. Create Query from Mock Postgres DB & verify active queries count", () => {
      PageList.AddNewPage();
      PageList.AddNewPage();
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

        dataSources.runQueryAndVerifyResponseViews({
          count: 1,
          operator: "gte",
        }); //minimum 1 rows are expected

        AppSidebar.navigate(AppSidebarButton.Data);
        dataSources
          .getDatasourceListItemDescription(mockDBName)
          .then(($queryCount) =>
            expect($queryCount).to.eq("1 queries in this app"),
          );

        entityExplorer.CreateNewDsQuery(mockDBName);
        // Validates the value of source for action creation -
        // should be self here as the user explicitly triggered create action
        cy.wait("@createNewApi").then((interception) => {
          expect(interception.request.body.source).to.equal("SELF");
        });

        dataSources.runQueryAndVerifyResponseViews({
          count: 1,
          operator: "gte",
        }); //minimum 1 rows are expected

        AppSidebar.navigate(AppSidebarButton.Data);
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
        dataSources.ValidateNSelectDropdown("Command", "Find document(s)");

        dataSources.runQueryAndVerifyResponseViews({
          count: 1,
          operator: "gte",
          responseTypes: ["JSON", "RAW"],
        });
      });
    });
  },
);
