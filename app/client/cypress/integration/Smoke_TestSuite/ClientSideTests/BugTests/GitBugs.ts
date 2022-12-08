import { ObjectsRegistry } from "../../../../support/Objects/Registry";
import { WIDGET } from "../../../../locators/WidgetLocators";

let dataSources = ObjectsRegistry.DataSources,
  gitSync = ObjectsRegistry.GitSync,
  agHelper = ObjectsRegistry.AggregateHelper,
  ee = ObjectsRegistry.EntityExplorer,
  propPane = ObjectsRegistry.PropertyPane,
  locator = ObjectsRegistry.CommonLocators;

let testName: any;
describe("Git Bugs", function() {
  before(() => {
    gitSync.CreateNConnectToGit();
    gitSync.CreateGitBranch();
  });

  it("1. Bug 18665 : Creates a new Git branch, Create datasource, discard it and check current branch", function() {
    dataSources.NavigateToDSCreateNew();
    dataSources.CreatePlugIn("PostgreSQL");
    dataSources.SaveDSFromDialog(false);
    agHelper.AssertElementVisible(gitSync._branchButton);
    cy.get("@gitRepoName").then((repoName) => {
      testName = repoName;
    });
  });

  it("2. Bug 18376:  navigateTo fails to set queryParams if the app is connected to Git", () => {
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
    agHelper.ValidateURL("testQP=Yes");//Validate we also ve the Query Params from Page1
  });

  after(() => {
    gitSync.DeleteTestGithubRepo(testName);
  });
});
