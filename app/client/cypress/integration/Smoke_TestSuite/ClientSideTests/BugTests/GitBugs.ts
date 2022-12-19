import { ObjectsRegistry } from "../../../../support/Objects/Registry";
import { WIDGET } from "../../../../locators/WidgetLocators";

let dataSources = ObjectsRegistry.DataSources,
  gitSync = ObjectsRegistry.GitSync,
  agHelper = ObjectsRegistry.AggregateHelper,
  ee = ObjectsRegistry.EntityExplorer,
  propPane = ObjectsRegistry.PropertyPane,
  locator = ObjectsRegistry.CommonLocators,
  apiPage = ObjectsRegistry.ApiPage;

let testName: any;
describe("Git Bugs", function() {
  it("1. Bug 16248, When GitSync modal is open, block shortcut action execution", function() {
    const largeResponseApiUrl = "https://jsonplaceholder.typicode.com/users";
    const modifierKey = Cypress.platform === "darwin" ? "meta" : "ctrl";
    apiPage.CreateAndFillApi(largeResponseApiUrl, "GitSyncTest");
    gitSync.OpenGitSyncModal();
    cy.get("body").type(`{${modifierKey}}{enter}`);
    cy.get("@postExecute").should("not.exist");
    gitSync.CloseGitSyncModal();
    cy.get("body").type(`{${modifierKey}}{enter}`);
    agHelper.ValidateNetworkStatus("@postExecute");
  });

  it("2. Bug 18665 : Creates a new Git branch, Create datasource, discard it and check current branch", function() {
    gitSync.CreateNConnectToGit();
    gitSync.CreateGitBranch();
    dataSources.NavigateToDSCreateNew();
    dataSources.CreatePlugIn("PostgreSQL");
    dataSources.SaveDSFromDialog(false);
    agHelper.AssertElementVisible(gitSync._branchButton);
    cy.get("@gitRepoName").then((repoName) => {
      testName = repoName;
    });
  });

  it("3. Bug 18376:  navigateTo fails to set queryParams if the app is connected to Git", () => {
    ee.AddNewPage();
    ee.DragDropWidgetNVerify(WIDGET.TEXT);
    ee.SelectEntityByName("Page1", "Pages");
    ee.DragDropWidgetNVerify(WIDGET.BUTTON);
    propPane.SelectPropertiesDropDown("onClick", "Navigate to");
    agHelper.Sleep(500);
    propPane.SelectPropertiesDropDown("onClick", "Page2", "Page");
    agHelper.EnterActionValue("Query Params", `{{{testQP: "Yes"}}}`);
    ee.SelectEntityByName("Page2", "Pages");
    ee.SelectEntityByName("Text1", "Widgets");
    propPane.UpdatePropertyFieldValue(
      "Text",
      "{{appsmith.URL.queryParams.testQP}}",
    );
    ee.SelectEntityByName("Page1", "Pages");
    agHelper.ClickButton("Submit");
    agHelper.Sleep(500);
    agHelper
      .GetText(locator._textWidget)
      .then(($qp) => expect($qp).to.eq("Yes"));
    agHelper.ValidateURL("branch=" + testName); //Validate we are still in Git branch
    agHelper.ValidateURL("testQP=Yes"); //Validate we also ve the Query Params from Page1
  });

  after(() => {
    gitSync.DeleteTestGithubRepo(testName);
  });
});
