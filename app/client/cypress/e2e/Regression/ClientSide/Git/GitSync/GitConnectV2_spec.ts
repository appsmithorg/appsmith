import { featureFlagIntercept } from "../../../../../support/Objects/FeatureFlags";
import * as _ from "../../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
  PageLeftPane,
} from "../../../../../support/Pages/EditorNavigation";

let ws1Name: string;
let ws2Name: string;
let app1Name: string;
let repoName: any;
let branchName: any;

describe("Git Connect V2", function () {
  before(() => {
    _.agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      ws1Name = "GitConnectV2-1" + uid;
      ws2Name = "GitConnectV2-2" + uid;
      app1Name = "GitConnectV2" + uid;
      _.homePage.CreateNewWorkspace(ws1Name, true);
      _.homePage.CreateNewWorkspace(ws2Name, true);
      _.homePage.CreateAppInWorkspace(ws1Name, app1Name);
    });
  });

  it("Testing connect to git flow - V2", function () {
    featureFlagIntercept({
      release_git_connect_v2_enabled: true,
    });

    _.gitSync.CreateNConnectToGitV2();

    cy.get("@gitRepoName").then((repName) => {
      repoName = repName;
    });
  });

  it("Testing import via git flow - V2", function () {
    featureFlagIntercept({
      release_git_connect_v2_enabled: true,
    });

    _.gitSync.CreateGitBranch("test", true);
    cy.get("@gitbranchName").then((bName) => {
      branchName = bName;
      _.entityExplorer.DragDropWidgetNVerify(_.draggableWidgets.TEXT, 300, 300);
      _.propPane.RenameWidget("Text1", "MyText");
      _.propPane.UpdatePropertyFieldValue("Text", "Hello World");
      _.gitSync.CommitAndPush();

      _.gitSync.ImportAppFromGitV2(ws2Name, repoName);
      _.gitSync.SwitchGitBranch(branchName);
      PageLeftPane.expandCollapseItem("Widgets");
      PageLeftPane.assertPresence("MyText");
      EditorNavigation.SelectEntityByName("MyText", EntityType.Widget);
      _.propPane.ValidatePropertyFieldValue("Text", "Hello World");
    });
  });

  after(() => {
    _.gitSync.DeleteTestGithubRepo(repoName);
  });
});
