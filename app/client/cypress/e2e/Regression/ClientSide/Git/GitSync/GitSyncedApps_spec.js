import EditorNavigation, {
  EntityType,
  PageLeftPane,
  PagePaneSegment,
} from "../../../../../support/Pages/EditorNavigation";

const generatePage = require("../../../../../locators/GeneratePage.json");
const dynamicInputLocators = require("../../../../../locators/DynamicInput.json");
import homePageLocators from "../../../../../locators/HomePage";
import datasource from "../../../../../locators/DatasourcesEditor.json";
import widgetsPage from "../../../../../locators/Widgets.json";

import {
  agHelper,
  entityExplorer,
  jsEditor,
  deployMode,
  homePage,
  gitSync,
  dataSources,
  table,
  draggableWidgets,
  locators,
  apiPage,
  propPane,
  assertHelper,
} from "../../../../../support/Objects/ObjectsCore";
import PageList from "../../../../../support/Pages/PageList";
import { EntityItems } from "../../../../../support/Pages/AssertHelper";

const newPage = "ApiCalls_1";
const pageName = "crudpage_1";
let tempBranch = "feat/tempBranch",
  tempBranch1 = "feat/testing",
  tempBranch0 = "test/tempBranch0";
const mainBranch = "master";
let datasourceName;
let repoName;

describe(
  "Git sync apps",
  {
    tags: [
      "@tag.Git",
      "@tag.AccessControl",
      "@tag.Workflows",
      "@tag.Module",
      "@tag.Theme",
      "@tag.JS",
      "@tag.Container",
      "@tag.ImportExport",
    ],
  },
  function () {
    it("1. Generate postgreSQL crud page , connect to git, clone the page, rename page with special character in it", () => {
      homePage.NavigateToHome();
      homePage.CreateNewApplication();

      // create New App and  generate Postgres CRUD page
      PageList.AddNewPage("Generate page with data");
      //cy.get(generatePage.generateCRUDPageActionCard).click();

      cy.get(generatePage.selectDatasourceDropdown).click();

      cy.contains("Connect new datasource").click({ force: true });

      agHelper.GetNClick(datasource.PostgreSQL);

      cy.fillPostgresDatasourceForm();

      cy.generateUUID().then((UUID) => {
        datasourceName = `${UUID}`;
        cy.renameDatasource(datasourceName);
      });

      cy.get(".t--save-datasource").click();
      cy.wait("@saveDatasource").should(
        "have.nested.property",
        "response.body.responseMeta.status",
        201,
      );

      cy.wait("@getDatasourceStructure").should(
        "have.nested.property",
        "response.body.responseMeta.status",
        200,
      );

      cy.get(generatePage.selectTableDropdown).click();

      cy.get(generatePage.dropdownOption).contains("public.configs").click();

      //  skip optional search column selection.
      cy.get(generatePage.generatePageFormSubmitBtn).click();

      cy.wait("@replaceLayoutWithCRUDPage").should(
        "have.nested.property",
        "response.body.responseMeta.status",
        201,
      );
      cy.wait("@getActions");
      cy.wait("@postExecute").should(
        "have.nested.property",
        "response.body.responseMeta.status",
        200,
      );

      cy.get("span:contains('Got it')").click();

      // connect app to git
      gitSync.CreateNConnectToGit(repoName);
      cy.get("@gitRepoName").then((repName) => {
        repoName = repName;
      });
      table.ReadTableRowColumnData(0, 1, "v2").then((cellData) => {
        expect(cellData).to.be.equal("New Config");
      });
      // rename page to crud_page
      entityExplorer.RenameEntityFromExplorer(
        "Page1",
        pageName,
        false,
        EntityItems.Page,
      );
      PageList.ClonePage(pageName);

      PageList.ShowList();
      PageLeftPane.assertPresence(`${pageName} Copy`);
      table.ReadTableRowColumnData(0, 1, "v2").then((cellData) => {
        expect(cellData).to.be.equal("New Config");
      });
    });

    it("2. Create api queries from api pane and cURL import , bind it to widget and clone page from page settings", () => {
      cy.fixture("datasources").then((datasourceFormData) => {
        cy.Createpage(newPage);
        EditorNavigation.SelectEntityByName(newPage, EntityType.Page);

        // create a get api call
        apiPage.CreateAndFillApi(datasourceFormData["echoApiUrl"], "get_data");
        apiPage.EnterHeader("info", "This is a test");
        apiPage.RunAPI();
        apiPage.ResponseStatusCheck("200 OK");
        // curl import
        apiPage.FillCurlNImport(
          `curl -d \'{"name":"morpheus","job":"leader"}\' -H Content-Type:application/json -X POST '` +
            datasourceFormData["echoApiUrl"],
        );
        cy.RunAPI();
        apiPage.ResponseStatusCheck("200 OK");
        cy.get("@curlImport").then((response) => {
          cy.expect(response.response.body.responseMeta.success).to.eq(true);
          agHelper.GetObjectName().then((text) => {
            const someText = text;
            expect(someText).to.equal(response.response.body.data.name);
          });
        });
        EditorNavigation.ShowCanvas();
        // bind input widgets to the api calls responses
        cy.dragAndDropToCanvas("inputwidgetv2", { x: 300, y: 300 });
        cy.get(".t--widget-inputwidgetv2").should("exist");
        cy.EnableAllCodeEditors();
        cy.get(
          `.t--property-control-defaultvalue ${dynamicInputLocators.input}`,
        )
          .last()
          .click({ force: true })
          .type("{{Api1.data.body.name}}", {
            parseSpecialCharSequences: false,
          });
        cy.dragAndDropToCanvas("inputwidgetv2", { x: 300, y: 500 });
        propPane.UpdatePropertyFieldValue(
          "Default value",
          "{{get_data.data.headers.Info}}",
        );
        agHelper.WaitUntilToastDisappear(
          "will be executed automatically on page load",
        );
        // clone the page from page settings
        PageList.ClonePage(newPage);
        EditorNavigation.SelectEntityByName(newPage, EntityType.Page);
      });
    });

    it("3. Commit and push changes, validate data binding on all pages in edit and deploy mode on master", () => {
      // verfiy data binding on all pages in edit mode
      cy.get(widgetsPage.inputWidget).should("be.visible");
      cy.get(widgetsPage.inputWidget)
        .first()
        .find(widgetsPage.dataclass)
        .invoke("val")
        .should("be.oneOf", ["morpheus", "This is a test"]);
      cy.get(widgetsPage.inputWidget)
        .last()
        .find(widgetsPage.dataclass)
        .invoke("val")
        .should("be.oneOf", ["morpheus", "This is a test"]);

      PageList.ShowList();
      EditorNavigation.SelectEntityByName(newPage, EntityType.Page);
      cy.get(widgetsPage.inputWidget)
        .first()
        .find(widgetsPage.dataclass)
        .should("have.value", "morpheus");
      cy.get(widgetsPage.inputWidget)
        .last()
        .find(widgetsPage.dataclass)
        .should("have.value", "This is a test");

      PageList.ShowList();
      EditorNavigation.SelectEntityByName(pageName, EntityType.Page);
      table.ReadTableRowColumnData(0, 1, "v2").then((cellData) => {
        expect(cellData).to.be.equal("New Config");
      });

      PageList.ShowList();
      EditorNavigation.SelectEntityByName(`${pageName} Copy`, EntityType.Page);
      table.ReadTableRowColumnData(0, 1, "v2").then((cellData) => {
        expect(cellData).to.be.equal("New Config");
      });
      // commit and push the changes
      gitSync.CommitAndPush(true);
      // verify data binding on all pages in deploy mode
      cy.latestDeployPreview();
      agHelper.GetNClickByContains(locators._deployedPage, pageName);
      table.ReadTableRowColumnData(0, 1, "v2").then((cellData) => {
        expect(cellData).to.be.equal("New Config");
      });
      agHelper.GetNClickByContains(locators._deployedPage, `${pageName} Copy`);
      table.ReadTableRowColumnData(0, 1, "v2").then((cellData) => {
        expect(cellData).to.be.equal("New Config");
      });
      agHelper.GetNClickByContains(locators._deployedPage, `${newPage}`);
      agHelper.RefreshPage("getConsolidatedData");
      cy.get(widgetsPage.dataclass)
        .first()
        .invoke("val")
        .should("be.oneOf", ["morpheus", "This is a test"]);
      cy.get(widgetsPage.dataclass)
        .last()
        .invoke("val")
        .should("be.oneOf", ["morpheus", "This is a test"]);
      cy.get(".t--page-switch-tab")
        .contains(`${newPage} Copy`)
        .click({ force: true });
      cy.get(widgetsPage.dataclass)
        .first()
        .invoke("val")
        .should("be.oneOf", ["morpheus", "This is a test"]);
      cy.get(widgetsPage.dataclass)
        .last()
        .invoke("val")
        .should("be.oneOf", ["morpheus", "This is a test"]);
      agHelper.AssertElementLength(
        locators._widgetInDeployed(draggableWidgets.INPUT_V2),
        2,
      );
      deployMode.NavigateBacktoEditor();
    });

    it("4. Create a new branch tempBranch, add jsObject and datasource query, move them to new page i.e. Child_Page and bind to widgets", () => {
      gitSync.CreateGitBranch(tempBranch, true);
      cy.get("@gitbranchName").then((branName) => {
        tempBranch = branName;
      });
      // create jsObject and rename it
      EditorNavigation.SelectEntityByName(`${newPage} Copy`, EntityType.Page);

      jsEditor.CreateJSObject('return "Success";');
      // create postgres select query
      dataSources.CreateQueryForDS(
        datasourceName,
        "SELECT * FROM users ORDER BY id LIMIT 10;",
        "get_users",
      );
      dataSources.RunQuery();
      // create a new page
      cy.Createpage("Child_Page");
      EditorNavigation.SelectEntityByName(`${newPage} Copy`, EntityType.Page);
      EditorNavigation.SelectEntityByName("get_users", EntityType.Query);
      agHelper.ActionContextMenuWithInPane({
        action: "Move to page",
        subAction: "Child_Page",
        toastToValidate: "moved to page",
      });
      agHelper.WaitUntilAllToastsDisappear();
      dataSources.RunQuery();
      EditorNavigation.SelectEntityByName(`${newPage} Copy`, EntityType.Page);
      EditorNavigation.SelectEntityByName("JSObject1", EntityType.JSObject);
      entityExplorer.ActionContextMenuByEntityName({
        entityNameinLeftSidebar: "JSObject1",
        action: "Move to page",
        subAction: "Child_Page",
        toastToValidate: "moved to page",
      });
      agHelper.WaitUntilAllToastsDisappear();
      // bind input widgets to the jsObject and query response
      cy.dragAndDropToCanvas("inputwidgetv2", { x: 300, y: 300 });
      cy.get(".t--widget-inputwidgetv2").should("exist");
      cy.EnableAllCodeEditors();
      cy.get(`.t--property-control-defaultvalue ${dynamicInputLocators.input}`)
        .last()
        .click({ force: true })
        .type("{{JSObject1.myFun1()}}", { parseSpecialCharSequences: false });
      cy.dragAndDropToCanvas("inputwidgetv2", { x: 300, y: 500 });
      cy.get(".t--widget-inputwidgetv2").should("exist");
      propPane.UpdatePropertyFieldValue(
        "Default value",
        "{{get_users.data[0].name}}",
      );
      PageLeftPane.switchSegment(PagePaneSegment.Queries);
      EditorNavigation.SelectEntityByName("get_users", EntityType.Query);
      dataSources.RunQuery();
    });

    it("5. Commit and push changes, validate data binding on all pages in edit and deploy mode on tempBranch", () => {
      // commit and push changes
      cy.get(homePageLocators.publishButton).click();
      cy.get(gitSync.locators.opsCommitInput).type("Initial Commit");
      cy.get(gitSync.locators.opsCommitBtn).click();
      gitSync.CloseOpsModal();
      // verfiy data binding on all pages in deploy mode
      cy.latestDeployPreview();
      cy.get(widgetsPage.dataclass).should("be.visible");
      cy.get(widgetsPage.dataclass)
        .first()
        .invoke("val")
        .should("be.oneOf", ["Success", "Test user 7"]);
      cy.get(widgetsPage.dataclass)
        .last()
        .invoke("val")
        .should("be.oneOf", ["Success", "Test user 7"]);
      agHelper.GetNClickByContains(locators._deployedPage, `${pageName}`);
      table.ReadTableRowColumnData(0, 1, "v2").then((cellData) => {
        expect(cellData).to.be.equal("New Config");
      });
      agHelper.GetNClickByContains(locators._deployedPage, `${pageName} Copy`);
      table.ReadTableRowColumnData(0, 1, "v2").then((cellData) => {
        expect(cellData).to.be.equal("New Config");
      });
      agHelper.GetNClickByContains(locators._deployedPage, `${newPage}`);
      cy.get(widgetsPage.dataclass)
        .first()
        .invoke("val")
        .should("be.oneOf", ["morpheus", "This is a test"]);
      cy.get(widgetsPage.dataclass)
        .last()
        .invoke("val")
        .should("be.oneOf", ["morpheus", "This is a test"]);

      agHelper.GetNClickByContains(locators._deployedPage, `${newPage} Copy`);
      cy.get(widgetsPage.dataclass)
        .first()
        .invoke("val")
        .should("be.oneOf", ["morpheus", "This is a test"]);
      cy.get(widgetsPage.dataclass)
        .last()
        .invoke("val")
        .should("be.oneOf", ["morpheus", "This is a test"]);
      deployMode.NavigateBacktoEditor();
    });

    it("6. Switch to master and verify no uncommitted changes should be shown on master", () => {
      cy.switchGitBranch("master");
      // verify commit input box is disabled
      cy.get(homePageLocators.publishButton).click();
      cy.get(gitSync.locators.opsCommitInput)
        .should("be.disabled")
        .and("have.text", "No changes to commit");
      gitSync.CloseOpsModal();
    });

    it("7. Switch to tempBranch , Clone the Child_Page, change it's visiblity to hidden and deploy, merge to master", () => {
      cy.switchGitBranch(tempBranch);
      //  clone the Child_Page
      EditorNavigation.SelectEntityByName("Child_Page", EntityType.Page);
      PageList.ClonePage("Child_Page");
      // change cloned page visiblity to hidden
      EditorNavigation.SelectEntityByName("Child_Page Copy", EntityType.Page);
      PageList.HidePage("Child_Page");

      EditorNavigation.SelectEntityByName("Child_Page", EntityType.Page);
      cy.wait("@getConsolidatedData");
      cy.get(homePageLocators.publishButton).click();
      cy.get(gitSync.locators.opsCommitInput).type("Initial Commit");
      cy.get(gitSync.locators.opsCommitBtn).click();
      gitSync.CloseOpsModal();

      gitSync.MergeToMaster();

      cy.latestDeployPreview();
      // verify page is hidden on deploy mode
      agHelper.AssertContains("Child_Page Copy", "not.exist");
      deployMode.NavigateBacktoEditor();
    });

    it("8. Verify Page visiblity on master in edit and deploy mode", () => {
      cy.switchGitBranch(mainBranch);
      cy.latestDeployPreview();
      agHelper.AssertContains("Child_Page Copy", "not.exist");
      deployMode.NavigateBacktoEditor();
    });

    // FLAKY needs to be rewritten
    it.skip("9. Create new branch, delete a page and merge back to master, verify page is deleted on master", () => {
      //cy.createGitBranch(tempBranch1);
      gitSync.CreateGitBranch(tempBranch1, true);
      // delete page from page settings
      EditorNavigation.SelectEntityByName("Child_Page Copy", EntityType.Page);
      cy.wait("@getConsolidatedData");
      PageList.DeletePage("Child_Page Copy");
      cy.get(homePageLocators.publishButton).click();
      cy.get(gitSync.locators.opsCommitInput).type("Initial Commit");
      cy.get(gitSync.locators.opsCommitBtn).click();
      gitSync.CloseOpsModal();
      gitSync.MergeToMaster();
      cy.latestDeployPreview();
      // verify page is hidden on deploy mode
      agHelper.AssertContains("Child_Page Copy", "not.exist");
      deployMode.NavigateBacktoEditor();
    });

    //Skipping these since these are causing chrome crash in CI, passes in electron.
    it.skip("10. After merge back to master, verify page is deleted on master", () => {
      // verify Child_Page is not on master
      cy.switchGitBranch(mainBranch);
      assertHelper.AssertDocumentReady();
      table.WaitUntilTableLoad();
      cy.readTabledataPublish("0", "1").then((cellData) => {
        expect(cellData).to.be.equal("New Config");
      });
      agHelper.AssertAutoSave();
      PageList.ShowList();
      PageLeftPane.assertAbsence("Child_Page Copy");
      // create another branch and verify deleted page doesn't exist on it
      gitSync.CreateGitBranch(tempBranch0, true);
      PageList.ShowList();
      PageLeftPane.assertAbsence("Child_Page Copy");
    });

    it.skip("11. Import app from git and verify page order should not change", () => {
      cy.get(homePageLocators.homeIcon).click();
      agHelper.GetNClick(homePageLocators.createNew, 0);
      cy.get(homePageLocators.workspaceImportAppOption).click({ force: true });
      cy.get(".t--import-json-card").next().click();
      // import application from git
      // cy.importAppFromGit(repoName);
      // verify page order remains same as in orignal app
      PageList.ShowList();
      cy.get(".t--entity-item").eq(1).contains("crudpage_1");
      cy.get(".t--entity-item").eq(2).contains("crudpage_1 Copy");
      cy.get(".t--entity-item").eq(3).contains("ApiCalls_1");
      cy.get(".t--entity-item").eq(4).contains("ApiCalls_1 Copy");
      cy.get(".t--entity-item").eq(5).contains("Child_Page");
    });

    after(() => {
      //clean up
      gitSync.DeleteTestGithubRepo(repoName);
    });
  },
);
