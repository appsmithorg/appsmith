// import { table } from "console";
import {
  agHelper,
  locators,
  entityExplorer,
  homePage,
  draggableWidgets,
  deployMode,
  gitSync,
  dataSources,
  jsEditor,
  assertHelper,
  table,
  propPane,
  apiPage,
} from "../../../../../support/Objects/ObjectsCore";

const newPage = "ApiCalls_1";
const pageName = "crudpage_1";
let tempBranch = "feat/tempBranch",
  tempBranch1 = "feat/testing",
  tempBranch0 = "test/tempBranch0";
const mainBranch = "master";
let datasourceName;
let repoName;

describe("Git sync apps", function () {
  before(() => {
    // homePage.NavigateToHome();
    // cy.createWorkspace();
    //  cy.wait("@createWorkspace").then((interception) => {
    //    const newWorkspaceName = interception.response.body.data.name;
    //    cy.CreateAppForWorkspace(newWorkspaceName, "gitSyncApp");
  });
  it("1. Generate postgreSQL crud page , connect to git, clone the page, rename page with special character in it", () => {
    homePage.NavigateToHome();
    homePage.CreateNewApplication();

    // create New App and  generate Postgres CRUD page
    entityExplorer.AddNewPage("Generate page with data");

    agHelper.GetNClick(dataSources._selectDatasourceDropdown);

    agHelper.ContainsNClick("Connect new datasource", 0, true);

    dataSources.CreatePlugIn("PostgreSQL");

    dataSources.FillPostgresDSForm();

    agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      datasourceName = `${uid}`;
      agHelper.RenameWithInPane(datasourceName, false);
    });

    agHelper.GetNClick(dataSources._saveDs);
    assertHelper.AssertNetworkStatus("@saveDatasource", 201);

    assertHelper.AssertNetworkStatus("@getDatasourceStructure");

    agHelper.GetNClick(dataSources._selectTableDropdown, 0, true);

    agHelper.GetNClickByContains(dataSources._dropdownOption, "public.configs");

    //  skip optional search column selection.
    agHelper.GetNClick(dataSources._generatePageBtn);

    assertHelper.AssertNetworkStatus("@replaceLayoutWithCRUDPage", 201);
    assertHelper.WaitForNetworkCall("@getActions");
    assertHelper.AssertNetworkStatus("@postExecute");

    agHelper.GetNClick(locators._visibleTextSpan("Got it"));

    // connect app to git
    gitSync.CreateNConnectToGit(repoName, false);

    cy.get("@gitRepoName").then((repName) => {
      repoName = repName;
    });

    agHelper.Sleep(3000);
    // rename page to crud_page
    entityExplorer.RenameEntityFromExplorer("Page1", pageName, true);
    agHelper.GetNClick(`${entityExplorer._entityNameContains}(${pageName})`);
    // create a clone of page
    agHelper
      .GetElement(entityExplorer._entityItemContains(pageName))
      .within(() => {
        agHelper.GetNClick(gitSync._contextMenu, 0, true);
      });
    agHelper.GetNClickByContains(gitSync._menuItemChildren, "Clone", 0, true);

    assertHelper.AssertNetworkStatus("@clonePage", 201);
  });

  it("2. Create api queries from api pane and cURL import , bind it to widget and clone page from page settings", () => {
    cy.fixture("datasources").then((datasourceFormData) => {
      entityExplorer.AddNewPage()?.then((pageName) => {
        agHelper.GetNClick(
          `[data-testid='t--entity-item-${pageName}'] ${gitSync._contextMenu}`,
          0,
          true,
        );
        agHelper.GetNClick(locators._appLeveltooltip("Edit name"), 0, true);
        agHelper.TypeText(entityExplorer._entityNameEdit, newPage + "{enter}");
        agHelper.GetNClick(entityExplorer._entityItemContains(newPage));
        agHelper.AssertElementAbsence(locators._loading);
      });

      agHelper.Sleep(1000);
      // create a get api call
      agHelper.GetNClick(entityExplorer._datasourceAddButton, 0, true);
      dataSources.NavigateToDSCreateNew();
      agHelper.AssertElementAbsence(locators._loading);

      agHelper.Sleep(2000);
      apiPage.CreateApi("get_data");
      // creating get request using echo
      agHelper.TypeText(
        apiPage._resourceUrl,
        datasourceFormData["echoApiUrl"],
        0,
        false,
      );

      agHelper.Sleep(5000);
      agHelper.TypeText(gitSync._headerKey, "info");
      agHelper.GetNClick("//span[text()='Key']");
      // entering the data in header
      agHelper.TypeText(gitSync._headerValue, "This is a test", 0, false);
      agHelper.Sleep(2000);
      apiPage.RunAPI();
      apiPage.ResponseStatusCheck("200");
      agHelper.GetNClick(locators._editorBackButton);
      // curl import
      dataSources.NavigateToDSCreateNew();
      agHelper.GetNClick(apiPage._curlImage, 0, true);
      dataSources.ImportCurlNRun(
        'curl -d \'{"name":"morpheus","job":"leader"}\' -H Content-Type:application/json -X POST ' +
          datasourceFormData["echoApiUrl"],
      );
      apiPage.ResponseStatusCheck("200");
      //   cy.get("@curlImport").then((response) => {
      //     expect(response.body.responseMeta.success).to.eq(true);
      //     agHelper.GetText(locators._queryName)
      //       .then((text) => {
      //         const someText = text;
      //         expect(someText).to.equal(response.body.data.name);
      //       });
      //   });
      agHelper.GetElement("body").then(($ele) => {
        if ($ele.find(locators._editorBackButton).length) {
          agHelper.GetNClick(locators._editorBackButton);
        }
      });
      agHelper.GetNClick(locators._openWidget + " btn");
      // bind input widgets to the api calls responses
      entityExplorer.DragDropWidgetNVerify("inputwidgetv2", 300, 300);
      agHelper.AssertElementExist(
        locators._widgetInDeployed(draggableWidgets.INPUT_V2),
      );
      agHelper.EnableAllCodeEditors();
      agHelper.TypeText(
        `${locators._propertyControl}defaultvalue ${gitSync._codeEditTargetCodeMirror}`,
        "{{Api1.data.body.name}}",
        0,
        false,
      );
      entityExplorer.DragDropWidgetNVerify("inputwidgetv2", 300, 500);
      agHelper.AssertElementAbsence(
        locators._widgetInDeployed(draggableWidgets.INPUT_V2),
      );
      agHelper.EnableAllCodeEditors();
      agHelper.TypeText(
        `${locators._propertyControl}defaultvalue ${gitSync._codeEditTargetCodeMirror}`,
        "{{get_data.data.headers.Info}}",
      );
      agHelper.Sleep(2000);
      // clone the page from page settings
      agHelper
        .GetElement(entityExplorer._entityItemContains(newPage))
        .within(() => {
          agHelper.GetNClick(gitSync._contextMenu, 0, true);
        });
      agHelper.GetNClickByContains(gitSync._menuItemChildren, "Clone");
      assertHelper.AssertNetworkStatus("@clonePage", 201);
      agHelper.GetNClick(entityExplorer._entityItemContains(newPage + " Copy"));
      assertHelper.WaitForNetworkCall("@getPage");
    });
  });

  it("3. Commit and push changes, validate data binding on all pages in edit and deploy mode on master", () => {
    // verfiy data binding on all pages in edit mode
    agHelper.Sleep(2000);
    agHelper.AssertElementVisible(locators._inputWidget);
    agHelper
      .GetElement(locators._inputWidget)
      .first()
      .find(gitSync._input)
      .invoke("val")
      .should("be.oneOf", ["morpheus", "This is a test"]);
    agHelper
      .GetElement(locators._inputWidget)
      .last()
      .find(gitSync._input)
      .invoke("val")
      .should("be.oneOf", ["morpheus", "This is a test"]);
    agHelper.GetNClick(entityExplorer._entityItemContains(newPage), 0);
    assertHelper.WaitForNetworkCall("@getPage");
    agHelper
      .GetElement(locators._inputWidget)
      .first()
      .find(gitSync._input)
      .should("have.value", "morpheus");
    agHelper
      .GetElement(locators._inputWidget)
      .last()
      .find(gitSync._input)
      .should("have.value", "This is a test");

    agHelper.GetNClick(entityExplorer._entityItemContains(pageName + " Copy"));
    assertHelper.WaitForNetworkCall("@getPage");
    table.ReadTableRowColumnData(0, 1).then((cellData) => {
      expect(cellData).to.be.equal("New Config");
    });
    agHelper.GetNClick(entityExplorer._entityItemContains(pageName), 0);
    assertHelper.WaitForNetworkCall("@getPage");
    table.ReadTableRowColumnData(0, 1).then((cellData) => {
      expect(cellData).to.be.equal("New Config");
    });
    // commit and push the changes
    gitSync.CommitAndPush();
    agHelper.Sleep(2000);
    // verify data binding on all pages in deploy mode
    gitSync.LatestDeployPreview();
    table.ReadTableRowColumnData(0, 1).then((cellData) => {
      expect(cellData).to.be.equal("New Config");
    });
    agHelper.GetNClickByContains(
      locators._deployedPage,
      `${pageName} Copy`,
      0,
      true,
    );
    table.ReadTableRowColumnData(0, 1).then((cellData) => {
      expect(cellData).to.be.equal("New Config");
    });
    agHelper.GetNClickByContains(locators._deployedPage, `${newPage}`, 0, true);
    agHelper
      .GetText(gitSync._input, "val", 0)
      .should("be.oneOf", ["morpheus", "This is a test"]);
    agHelper
      .GetText(gitSync._input, "val", 1)
      .should("be.oneOf", ["morpheus", "This is a test"]);
    agHelper.GetNClickByContains(
      locators._deployedPage,
      `${newPage} Copy`,
      0,
      true,
    );
    agHelper
      .GetText(gitSync._input, "val", 0)
      .should("be.oneOf", ["morpheus", "This is a test"]);
    agHelper
      .GetText(gitSync._input, "val", 1)
      .should("be.oneOf", ["morpheus", "This is a test"]);
    deployMode.NavigateBacktoEditor();
  });

  it("4. Create a new branch tempBranch, add jsObject and datasource query, move them to new page i.e. Child_Page and bind to widgets", () => {
    gitSync.CreateGitBranch(tempBranch, true);

    agHelper.Sleep(1000);
    // create jsObject and rename it
    jsEditor.CreateJSObject('return "Success";');
    agHelper.Sleep(2000);
    // create postgres select query
    dataSources.NavigateFromActiveDS(datasourceName, true);
    dataSources.EnterQuery("SELECT * FROM users ORDER BY id LIMIT 10;");
    agHelper.RenameWithInPane("get_users");
    dataSources.RunQuery();
    // create a new page
    entityExplorer.ExpandCollapseEntity("Pages");
    entityExplorer.AddNewPage()?.then((pageName) => {
      agHelper.GetNClick(
        `[data-testid='t--entity-item-${pageName}'] ${gitSync._contextMenu}`,
        0,
        true,
      );
      agHelper.GetNClick(locators._appLeveltooltip("Edit name"), 0, true);
      agHelper.TypeText(
        entityExplorer._entityNameEdit,
        "Child_Page" + "{enter}",
      );
      agHelper.GetNClick(entityExplorer._entityItemContains("Child_Page"));
      agHelper.AssertElementAbsence(locators._loading);
    });
    agHelper.Sleep(1000);
    agHelper.GetNClick(
      `${entityExplorer._entityNameContains}(${newPage} Copy)`,
      0,
      true,
    );
    agHelper.Sleep(2000); // adding wait for query to load
    entityExplorer.SelectEntityByName("get_users", "Queries/JS");
    agHelper.ActionContextMenuWithInPane({
      action: "Move to page",
      subAction: "Child_Page",
      toastToValidate: "moved to page",
    });
    dataSources.RunQuery();
    agHelper.Sleep(2000);
    agHelper.GetNClick(
      `${entityExplorer._entityNameContains}(${newPage} Copy)`,
      0,
      true,
    );
    agHelper.Sleep(2000);
    entityExplorer.SelectEntityByName("JSObject1", "Queries/JS");
    entityExplorer.ActionContextMenuByEntityName({
      entityNameinLeftSidebar: "JSObject1",
      action: "Move to page",
      subAction: "Child_Page",
      toastToValidate: "moved to page",
    });
    agHelper.Sleep(2000);
    entityExplorer.NavigateToSwitcher("Widgets");
    agHelper.GetNClick(locators._openWidget + " button", 0, true);
    // bind input widgets to the jsObject and query response
    entityExplorer.DragDropWidgetNVerify("inputwidgetv2", 300, 300);
    agHelper.AssertElementExist(
      locators._widgetInDeployed(draggableWidgets.INPUT_V2),
    );
    agHelper.EnableAllCodeEditors();
    agHelper
      .GetElement(
        `${locators._propertyControl}defaultvalue ${gitSync._codeEditTargetCodeMirror}`,
      )
      .last()
      .click({ force: true })
      .type("{{JSObject1.myFun1()}}", { parseSpecialCharSequences: false });
    entityExplorer.DragDropWidgetNVerify("inputwidgetv2", 300, 500);
    agHelper.AssertElementExist(
      locators._widgetInDeployed(draggableWidgets.INPUT_V2),
    );
    agHelper.EnableAllCodeEditors();
    agHelper
      .GetElement(
        `${locators._propertyControl}defaultvalue ${gitSync._codeEditTargetCodeMirror}`,
      )
      .last()
      .click({ force: true })
      .type("{{get_users.data[0].name}}", {
        parseSpecialCharSequences: false,
      });
    agHelper.Sleep(2000);
  });

  it("5. Commit and push changes, validate data binding on all pages in edit and deploy mode on tempBranch", () => {
    // commit and push changes
    gitSync.CommitAndPush();
    agHelper.Sleep(8000);
    // verfiy data binding on all pages in deploy mode
    agHelper.Sleep(4000);
    gitSync.LatestDeployPreview();
    agHelper.Sleep(2000);
    agHelper.AssertElementVisible(gitSync._input);
    agHelper
      .GetText(gitSync._input, "val", 0)
      .should("be.oneOf", ["Success", "Test user 7"]);
    agHelper
      .GetText(gitSync._input, "val", 1)
      .should("be.oneOf", ["Success", "Test user 7"]);
    agHelper.GetNClickByContains(
      locators._deployedPage,
      `${pageName}`,
      0,
      true,
    );
    table.ReadTableRowColumnData(0, 1).then((cellData) => {
      expect(cellData).to.be.equal("New Config");
    });
    agHelper.GetNClickByContains(
      locators._deployedPage,
      `${pageName} Copy`,
      0,
      true,
    );
    table.ReadTableRowColumnData(0, 1).then((cellData) => {
      expect(cellData).to.be.equal("New Config");
    });
    agHelper.GetNClickByContains(locators._deployedPage, `${newPage}`, 0, true);
    agHelper.Sleep(2000);
    agHelper
      .GetText(gitSync._input, "val", 0)
      .should("be.oneOf", ["morpheus", "This is a test"]);
    agHelper
      .GetText(gitSync._input, "val", 1)
      .should("be.oneOf", ["morpheus", "This is a test"]);
    agHelper.GetNClickByContains(
      locators._deployedPage,
      `${newPage} Copy`,
      0,
      true,
    );
    agHelper.Sleep(2000);
    agHelper
      .GetText(gitSync._input, "val", 0)
      .should("be.oneOf", ["morpheus", "This is a test"]);
    agHelper
      .GetText(gitSync._input, "val", 1)
      .should("be.oneOf", ["morpheus", "This is a test"]);
    agHelper.GetNClick(locators._backToEditor);
    agHelper.Sleep(2000);
    // verfiy data binding on all pages in edit mode
    /* cy.get(locators._inputWidget).first().find(gitSync._input).should("have.value", "morpheus");
       cy.get(locators._inputWidget)
        .last()
        .find(gitSync._input)
        .should("have.value", "This is a test");
      cy.get(`.t--entity-item:contains(Child_Page)`)
        .first()
        .click();
      cy.wait("@getPage");
      cy.reload();
      cy.wait(3000);
      cy.get(gitSync._input)
        .first()
        .should("have.value", "Success");
      cy.get(gitSync._input)
        .last()
        .should("have.value", "Test user 7");
      cy.get(entityExplorer._entityItemContains(newPage))
        .first()
        .click();
      cy.wait("@getPage");
      cy.get(locators._inputWidget).first().find(gitSync._input).should("have.value", "morpheus");
       cy.get(locators._inputWidget)
        .last()
        .find(gitSync._input)
        .should("have.value", "This is a test");
  
      cy.get(`.t--entity-item:contains(${pageName} Copy)`).click();
      cy.wait("@getPage");
      table.ReadTableRowColumnData(0, 1).then((cellData) => {
        expect(cellData).to.be.equal("New Config");
      });
      cy.get(`.t--entity-item:contains(${pageName})`)
        .first()
        .click();
      cy.wait("@getPage");
      table.ReadTableRowColumnData(0, 1).then((cellData) => {
        expect(cellData).to.be.equal("New Config");
      }); */
  });

  it("6. Switch to master and verify no uncommitted changes should be shown on master", () => {
    gitSync.SwitchGitBranch("master");
    agHelper.Sleep(2000);
    // verify commit input box is disabled
    agHelper.GetNClick(locators._publishButton);
    agHelper
      .AssertElementEnabledDisabled(gitSync._commitCommentInput)
      .and("have.text", "No changes to commit");
    gitSync.CloseGitSyncModal();
  });

  it("7. Switch to tempBranch , Clone the Child_Page, change it's visiblity to hidden and deploy, merge to master", () => {
    gitSync.SwitchGitBranch(tempBranch);
    agHelper.Sleep(2000);

    //  clone the Child_Page
    entityExplorer.SelectEntityByName("Child_Page", "Pages");
    entityExplorer.ClonePage("Child_Page");
    // change cloned page visiblity to hidden
    entityExplorer.SelectEntityByName("Child_Page Copy", "Pages");
    entityExplorer.ActionContextMenuByEntityName({
      entityNameinLeftSidebar: "Child_Page",
      action: "Hide",
    });

    entityExplorer.SelectEntityByName("Child_Page", "Pages");
    assertHelper.WaitForNetworkCall("@getPage");
    gitSync.CommitAndPush();
    agHelper.Sleep(2000);
    gitSync.CheckMergeConflicts(mainBranch);
    agHelper.AssertContains(Cypress.env("MESSAGES").NO_MERGE_CONFLICT());
    agHelper.GetNClick(gitSync._mergeButton);
    assertHelper.AssertNetworkStatus("@mergeBranch", 200);
    agHelper.AssertContains(Cypress.env("MESSAGES").MERGED_SUCCESSFULLY());
    gitSync.CloseGitSyncModal();
    agHelper.Sleep(2000);
    gitSync.LatestDeployPreview();
    // verify page is hidden on deploy mode
    agHelper.AssertContains("Child_Page Copy", "not.exist");
    deployMode.NavigateBacktoEditor();
  });

  it("8. Verify Page visiblity on master in edit and deploy mode", () => {
    gitSync.SwitchGitBranch(mainBranch);
    agHelper.Sleep(2000);
    gitSync.LatestDeployPreview();
    agHelper.AssertContains("Child_Page Copy", "not.exist");
    deployMode.NavigateBacktoEditor();
  });

  it("9. Create new branch, delete a page and merge back to master, verify page is deleted on master", () => {
    gitSync.CreateGitBranch(tempBranch1, true);
    // delete page from page settings
    entityExplorer.ExpandCollapseEntity("Pages");
    agHelper
      .GetElement(entityExplorer._entityItemContains("Child_Page Copy"))
      .within(() => {
        agHelper.GetNClick(gitSync._contextMenu, 0, true);
      });
    agHelper.Sleep(2000);
    agHelper.ActionContextMenuWithInPane({
      action: "Delete",
      subAction: "Child_Page",
    });
    agHelper.ActionContextMenuWithInPane({
      action: "Delete",
      subAction: "Child_Page Copy",
    });

    gitSync.CommitAndPush();
    agHelper.Sleep(2000);
    gitSync.CheckMergeConflicts(mainBranch);
    agHelper.AssertContains(Cypress.env("MESSAGES").NO_MERGE_CONFLICT());
    agHelper.GetNClick(gitSync._mergeButton);
    assertHelper.AssertNetworkStatus("@mergeBranch", 200);
    agHelper.AssertContains(Cypress.env("MESSAGES").MERGED_SUCCESSFULLY());
    gitSync.CloseGitSyncModal();
    agHelper.Sleep(2000);
    // verify Child_Page is not on master
    gitSync.SwitchGitBranch(mainBranch);
    entityExplorer.ExpandCollapseEntity("Pages");
    agHelper.AssertElementAbsence(
      `${entityExplorer._entityNameContains}("Child_Page Copy")`,
    );
    // create another branch and verify deleted page doesn't exist on it
    gitSync.CreateGitBranch(tempBranch0, true);
    entityExplorer.ExpandCollapseEntity("Pages");
    agHelper.AssertElementAbsence(
      `${entityExplorer._entityNameContains}("Child_Page Copy")`,
    );
  });

  it("10. Import app from git and verify page order should not change", () => {
    agHelper.GetNClick(homePage._homeIcon);
    agHelper.GetNClick(homePage._optionsIcon, 0);
    agHelper.GetNClick(homePage._workspaceImport, 0, true);
    agHelper.GetElement(gitSync._importJsonCard).next().click();
    // import application from git
    //   cy.importAppFromGit(repoName);
    gitSync.importAppFromGit(repoName, true, "");
    agHelper.Sleep(2000);
    // verify page order remains same as in orignal app
    entityExplorer.ExpandCollapseEntity("Pages");
    agHelper.GetNAssertContains(
      entityExplorer._entityItem,
      "crudpage_1",
      "exist",
      0,
    );
    agHelper.GetNAssertContains(
      entityExplorer._entityItem,
      "crudpage_1 Copy",
      "exist",
      1,
    );
    agHelper.GetNAssertContains(
      entityExplorer._entityItem,
      "ApiCalls_1",
      "exist",
      2,
    );
    agHelper.GetNAssertContains(
      entityExplorer._entityItem,
      "ApiCalls_1 Copy",
      "exist",
      3,
    );
    agHelper.GetNAssertContains(
      entityExplorer._entityItem,
      "Child_Page",
      "exist",
      4,
    );
  });

  after(() => {
    //clean up
    gitSync.DeleteTestGithubRepo(repoName);
  });
});
