import {
  dataSources,
  homePage,
  agHelper,
} from "../../../../support/Objects/ObjectsCore";

let currentWorkspace: string, currentAppName: string, forkWorkspaceName: string;

describe(
  "Fork application across workspaces",
  {
    tags: [
      "@tag.Fork",
      "@tag.Sanity",
      "@tag.Datasource",
      "@tag.Git",
      "@tag.Table",
      "@tag.JS",
    ],
  },
  function () {
    it("Bug 24702: Signed user should be able to fork a public forkable app & Check if the forked application has the same dsl as the original", function () {
      // Create new workspace to create App in
      agHelper.GenerateUUID();
      cy.get("@guid").then((uid) => {
        currentAppName = "MongoApp" + uid;
        cy.get("@workspaceName").then((workspaceName: any) => {
          currentWorkspace = workspaceName;
        });
        homePage.RenameApplication(currentAppName);

        // Create datasource and query
        dataSources.CreateDataSource("Mongo", true, false);
        dataSources.CreateQueryAfterDSSaved("", "Query1");

        agHelper.GenerateUUID();
        cy.get("@guid").then((uid) => {
          forkWorkspaceName = "ForkApp" + uid;
          homePage.CreateNewWorkspace(forkWorkspaceName, true);
          homePage.SelectWorkspace(currentWorkspace);
          homePage.ForkApplication(currentAppName, forkWorkspaceName);

          dataSources.FillMongoDatasourceFormWithURI();
          dataSources.TestSaveDatasource(true, true);
        });
      });
    });

    after(() => {
      homePage.NavigateToHome();
      homePage.DeleteApplication(currentAppName); //forked app
      homePage.SelectWorkspace(currentWorkspace, false); //1st ws
      homePage.DeleteApplication(currentAppName); //1st ws app
      homePage.DeleteWorkspace(currentWorkspace); //1st ws
      homePage.SelectWorkspace(forkWorkspaceName, false); //forked ws
      homePage.DeleteWorkspace(forkWorkspaceName);
    });
  },
);
