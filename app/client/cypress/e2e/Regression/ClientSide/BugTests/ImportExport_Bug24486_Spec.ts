import * as _ from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
  PageLeftPane,
} from "../../../../support/Pages/EditorNavigation";

let guid: any;
let ws1Name;
let ws2Name;
let app1Name: any;
let repoName: any;
let branchName;

describe("Issue 24486 - Issue with Export Application", () => {
  before(() => {
    _.agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      guid = uid;
      ws1Name = "Bug24486-w1" + guid;
      app1Name = "Bug24486-a1" + guid;
      _.homePage.CreateNewWorkspace(ws1Name, true);
      _.homePage.CreateAppInWorkspace(ws1Name, app1Name);
    });
  });

  it("1. Should export the current branch", () => {
    _.entityExplorer.DragDropWidgetNVerify(_.draggableWidgets.BUTTON, 200, 200);
    _.gitSync.CreateNConnectToGit();
    cy.get("@gitRepoName").then((repName) => {
      repoName = repName;

      _.gitSync.CreateGitBranch(`b1`, true);

      cy.get("@gitbranchName").then((bName) => {
        branchName = bName;
        _.entityExplorer.DragDropWidgetNVerify(
          _.draggableWidgets.TEXT,
          300,
          300,
        );
        _.propPane.RenameWidget("Text1", "MyText");
        _.propPane.UpdatePropertyFieldValue("Text", "Hello World");
        _.gitSync.CommitAndPush();

        _.agHelper.GetNClick(_.locators._appEditMenuBtn, 0, true);
        _.agHelper.GetNClick(_.locators._appEditExportSettings);
        cy.get(`a[id=t--export-app-link]`).then((anchor) => {
          const url = anchor.prop("href");
          cy.request(url).then(({ body, headers }) => {
            expect(headers).to.have.property(
              "content-type",
              "application/json",
            );
            expect(headers)
              .to.have.property("content-disposition")
              .that.includes("attachment;")
              .and.includes(`filename*=UTF-8''${app1Name}.json`);
            cy.writeFile("cypress/fixtures/app-b24486.json", body, "utf-8");
            _.agHelper.AssertContains("Successfully exported");
            _.agHelper.WaitUntilAllToastsDisappear();
          });
        });
      });
    });
  });

  it("2. Should import the exported branch", () => {
    ws2Name = "Bug24486-w2" + guid;
    _.homePage.CreateNewWorkspace(ws2Name, true);
    _.homePage.ImportApp("app-b24486.json", ws2Name);
    PageLeftPane.expandCollapseItem("Widgets");
    PageLeftPane.assertPresence("MyText");
    EditorNavigation.SelectEntityByName("MyText", EntityType.Widget);
    _.propPane.ValidatePropertyFieldValue("Text", "Hello World");
    PageLeftPane.assertPresence("Button1");
    EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
    _.propPane.ValidatePropertyFieldValue("Label", "Submit");
  });

  after(() => {
    _.gitSync.DeleteTestGithubRepo(repoName);
  });
});
