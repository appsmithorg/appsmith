import { featureFlagIntercept } from "../../../../../support/Objects/FeatureFlags";
import * as _ from "../../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";

let ws1Name: string;
let ws2Name: string;
let app1Name: string;
let repoName: any;
let branchName: any;

describe("Git Connect V2", { tags: ["@tag.Git", "@tag.Sanity"] }, function () {
  before(() => {
    _.agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      ws1Name = "GCV2-1" + uid;
      ws2Name = "GCV2-2" + uid;
      app1Name = "GCV2" + uid;
      _.homePage.CreateNewWorkspace(ws1Name, true);
      _.homePage.CreateNewWorkspace(ws2Name, true);
      _.homePage.SelectWorkspace(ws1Name);
      _.homePage.CreateAppInWorkspace(ws1Name, app1Name);
    });
  });

  it("Testing connect to git flow - V2", function () {
    _.gitSync.CreateNConnectToGit();

    cy.get("@gitRepoName").then((repName) => {
      repoName = repName;
    });
  });

  it("Testing import via git flow - V2", function () {
    _.gitSync.CreateGitBranch("test", true);
    cy.get("@gitbranchName").then((bName) => {
      branchName = bName;
      _.entityExplorer.DragDropWidgetNVerify(_.draggableWidgets.TEXT, 300, 300);
      _.propPane.RenameWidget("Text1", "MyText");
      _.propPane.UpdatePropertyFieldValue("Text", "Hello World");
      _.gitSync.CommitAndPush();

      _.gitSync.ImportAppFromGit(ws2Name, repoName);
      _.gitSync.SwitchGitBranch(branchName);
      EditorNavigation.SelectEntityByName("MyText", EntityType.Widget);
      _.propPane.ValidatePropertyFieldValue("Text", "Hello World");
    });
  });

  after(() => {
    _.gitSync.DeleteTestGithubRepo(repoName);
  });
});
