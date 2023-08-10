import {
  dataSources,
  homePage,
  agHelper,
} from "../../../../support/Objects/ObjectsCore";

let currentWorkspace: string, currentAppName: string, forkWorkspaceName: string;

describe("Fork application across workspaces", function () {
  it("Bug 24702: Signed user should be able to fork a public forkable app & Check if the forked application has the same dsl as the original", function () {
    // Create new workspace to create App in
    agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      currentWorkspace = "CurrentWorkspace " + uid;
      currentAppName = "MongoQueryApp " + uid;
      homePage.CreateNewWorkspace(currentWorkspace, true);
      homePage.CreateAppInWorkspace(currentWorkspace, currentAppName);

      // Create datasource and query
      dataSources.CreateDataSource("Mongo", true, false);
      dataSources.CreateQueryAfterDSSaved("", "Query1");

      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(2000);

      agHelper.GenerateUUID();
      cy.get("@guid").then((uid) => {
        forkWorkspaceName = "ForkApplication" + uid;
        homePage.CreateNewWorkspace(forkWorkspaceName, true);
        homePage.FilterApplication(currentAppName);

        agHelper.Sleep(500);

        homePage.ForkApplication(currentAppName, forkWorkspaceName);

        dataSources.FillMongoDatasourceFormWithURI();
        dataSources.TestSaveDatasource(true, true);
      });
    });
  });

  after(() => {
    homePage.NavigateToHome();
    homePage.DeleteApplication(currentAppName);
    homePage.DeleteApplication(currentAppName);
    homePage.DeleteWorkspace(currentWorkspace);
    homePage.DeleteWorkspace(forkWorkspaceName);
  });
});
