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
    ee.SelectEntityByName("Page1", "Pages");
    ee.DragDropWidgetNVerify(WIDGET.BUTTON);
    propPane.SelectPropertiesDropDown("onClick", "Navigate to");
    propPane.SelectPropertiesDropDown("onClick", "Page2");
    propPane.UpdatePropertyFieldValue("Query Params", `{{{testQP: "Yes"}}}`);
    ee.SelectEntityByName("Page2", "Pages");
    ee.DragDropWidgetNVerify(WIDGET.TEXT);
    propPane.UpdatePropertyFieldValue(
      "Text",
      "{{appsmith.URL.queryParams.testQP}}",
    );
    agHelper
      .GetText(locator._textWidget)
      .then(($qp) => expect($qp).to.eq("Yes"));
  });

  after(() => {
    cy.log("gitRepoName is " + testName);
    //gitSync.DeleteTestGithubRepo(testName);
  });
});
