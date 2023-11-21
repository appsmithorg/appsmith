const generatePage = require("../../../../../locators/GeneratePage.json");
const explorer = require("../../../../../locators/explorerlocators.json");
const apiwidget = require("../../../../../locators/apiWidgetslocator.json");
const dynamicInputLocators = require("../../../../../locators/DynamicInput.json");
const commonlocators = require("../../../../../locators/commonlocators.json");
import gitSyncLocators from "../../../../../locators/gitSyncLocators";
import ApiEditor from "../../../../../locators/ApiEditor";
import homePageLocators from "../../../../../locators/HomePage";
import datasource from "../../../../../locators/DatasourcesEditor.json";

import {
  agHelper,
  entityExplorer,
  jsEditor,
  deployMode,
  homePage,
  gitSync,
  dataSources,
} from "../../../../../support/Objects/ObjectsCore";

const newPage = "ApiCalls_1";
const pageName = "crudpage_1";
let tempBranch = "feat/tempBranch",
  tempBranch1 = "feat/testing",
  tempBranch0 = "test/tempBranch0";
const mainBranch = "master";
let datasourceName;
let repoName;

describe.skip("Git sync apps", function () {
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
    //cy.get(generatePage.generateCRUDPageActionCard).click();

    cy.get(generatePage.selectDatasourceDropdown).click();

    cy.contains("Connect new datasource").click({ force: true });

    cy.get(datasource.PostgreSQL).click();

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

    cy.wait(3000);
    // rename page to crud_page
    cy.renameEntity("Page1", pageName);
    cy.get(`.t--entity-name:contains(${pageName})`)
      .trigger("mouseover")
      .click({ force: true });
    // create a clone of page
    cy.get(`.t--entity-item:contains(${pageName})`).within(() => {
      cy.get(".t--context-menu").click({ force: true });
    });
    cy.selectAction("Clone");

    cy.wait("@clonePage").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      201,
    );
  });

  it("2. Create api queries from api pane and cURL import , bind it to widget and clone page from page settings", () => {
    cy.fixture("datasources").then((datasourceFormData) => {
      cy.Createpage(newPage);
      cy.get(`.t--entity-item:contains(${newPage})`).click();
      cy.wait(1000);
      // create a get api call
      cy.CreateAPI("get_data");
      // creating get request using echo
      cy.get(apiwidget.resourceUrl)
        .first()
        .click({ force: true })
        .type(datasourceFormData["echoApiUrl"], {
          parseSpecialCharSequences: false,
        });
      //.type("{esc}}");
      cy.wait(5000);
      cy.get(apiwidget.headerKey).type("info");
      cy.xpath("//span[text()='Key']").click();
      // entering the data in header
      cy.get(apiwidget.headerValue).type("This is a test", {
        parseSpecialCharSequences: false,
      });
      cy.wait(2000);
      cy.SaveAndRunAPI();
      cy.ResponseStatusCheck("200");
      cy.get(".t--close-editor").click();
      // curl import
      dataSources.NavigateToDSCreateNew();
      cy.get(ApiEditor.curlImage).click({ force: true });
      cy.get("textarea").type(
        'curl -d \'{"name":"morpheus","job":"leader"}\' -H Content-Type:application/json -X POST ' +
          datasourceFormData["echoApiUrl"],
        {
          force: true,
          parseSpecialCharSequences: false,
        },
      );
      cy.importCurl();
      cy.RunAPI();
      cy.ResponseStatusCheck("200");
      cy.get("@curlImport").then((response) => {
        cy.expect(response.response.body.responseMeta.success).to.eq(true);
        cy.get(apiwidget.ApiName)
          .invoke("text")
          .then((text) => {
            const someText = text;
            expect(someText).to.equal(response.response.body.data.name);
          });
      });
      cy.get("body").then(($ele) => {
        if ($ele.find(".t--close-editor").length) {
          cy.get(".t--close-editor").click();
        }
      });
      cy.get(explorer.addWidget).click();
      // bind input widgets to the api calls responses
      cy.dragAndDropToCanvas("inputwidgetv2", { x: 300, y: 300 });
      cy.get(".t--widget-inputwidgetv2").should("exist");
      cy.EnableAllCodeEditors();
      cy.get(`.t--property-control-defaultvalue ${dynamicInputLocators.input}`)
        .last()
        .click({ force: true })
        .type("{{Api1.data.body.name}}", { parseSpecialCharSequences: false });
      cy.dragAndDropToCanvas("inputwidgetv2", { x: 300, y: 500 });
      cy.get(".t--widget-inputwidgetv2").should("exist");
      cy.EnableAllCodeEditors();
      cy.get(`.t--property-control-defaultvalue ${dynamicInputLocators.input}`)
        .last()
        .click({ force: true })
        .type("{{get_data.data.headers.Info}}", {
          parseSpecialCharSequences: false,
        });
      cy.wait(2000);
      // clone the page from page settings
      cy.get(`.t--entity-item:contains(${newPage})`).within(() => {
        cy.get(".t--context-menu").click({ force: true });
      });
      cy.selectAction("Clone");
      cy.wait("@clonePage").should(
        "have.nested.property",
        "response.body.responseMeta.status",
        201,
      );
      cy.get(`.t--entity-item:contains(${newPage} Copy)`).click();
      cy.wait("@getPage");
    });
  });

  it("3. Commit and push changes, validate data binding on all pages in edit and deploy mode on master", () => {
    // verfiy data binding on all pages in edit mode
    cy.wait(2000);
    agHelper.RefreshPage("getPage");
    cy.get(".t--draggable-inputwidgetv2").should("be.visible");
    cy.get(".t--draggable-inputwidgetv2")
      .first()
      .find(".bp3-input")
      .invoke("val")
      .should("be.oneOf", ["morpheus", "This is a test"]);
    cy.get(".t--draggable-inputwidgetv2")
      .last()
      .find(".bp3-input")
      .invoke("val")
      .should("be.oneOf", ["morpheus", "This is a test"]);
    cy.get(`.t--entity-item:contains(${newPage})`).first().click();
    cy.wait("@getPage");
    cy.get(".t--draggable-inputwidgetv2")
      .first()
      .find(".bp3-input")
      .should("have.value", "morpheus");
    cy.get(".t--draggable-inputwidgetv2")
      .last()
      .find(".bp3-input")
      .should("have.value", "This is a test");

    cy.get(`.t--entity-item:contains(${pageName} Copy)`).click();
    cy.wait("@getPage");
    cy.readTabledataPublish("0", "1").then((cellData) => {
      expect(cellData).to.be.equal("New Config");
    });
    cy.get(`.t--entity-item:contains(${pageName})`).first().click();
    cy.wait("@getPage");
    cy.readTabledataPublish("0", "1").then((cellData) => {
      expect(cellData).to.be.equal("New Config");
    });
    // commit and push the changes
    cy.commitAndPush();
    cy.wait(2000);
    // verify data binding on all pages in deploy mode
    cy.latestDeployPreview();
    cy.readTabledataPublish("0", "1").then((cellData) => {
      expect(cellData).to.be.equal("New Config");
    });
    cy.get(".t--page-switch-tab")
      .contains(`${pageName} Copy`)
      .click({ force: true });
    cy.readTabledataPublish("0", "1").then((cellData) => {
      expect(cellData).to.be.equal("New Config");
    });
    cy.get(".t--page-switch-tab").contains(`${newPage}`).click({ force: true });
    agHelper.RefreshPage();
    cy.get(".bp3-input")
      .first()
      .invoke("val")
      .should("be.oneOf", ["morpheus", "This is a test"]);
    cy.get(".bp3-input")
      .last()
      .invoke("val")
      .should("be.oneOf", ["morpheus", "This is a test"]);
    cy.get(".t--page-switch-tab")
      .contains(`${newPage} Copy`)
      .click({ force: true });
    cy.get(".bp3-input")
      .first()
      .invoke("val")
      .should("be.oneOf", ["morpheus", "This is a test"]);
    cy.get(".bp3-input")
      .last()
      .invoke("val")
      .should("be.oneOf", ["morpheus", "This is a test"]);
    deployMode.NavigateBacktoEditor();
  });

  it("4. Create a new branch tempBranch, add jsObject and datasource query, move them to new page i.e. Child_Page and bind to widgets", () => {
    //cy.createGitBranch(tempBranch);
    gitSync.CreateGitBranch(tempBranch, true);
    cy.get("@gitbranchName").then((branName) => {
      tempBranch = branName;
    });
    cy.wait(1000);
    // create jsObject and rename it
    jsEditor.CreateJSObject('return "Success";');
    cy.wait(2000);
    // create postgres select query
    //cy.CheckAndUnfoldEntityItem("Datasources");
    dataSources.NavigateFromActiveDS(datasourceName, true);
    dataSources.EnterQuery("SELECT * FROM users ORDER BY id LIMIT 10;");
    agHelper.RenameWithInPane("get_users");
    dataSources.RunQuery();
    // create a new page
    cy.CheckAndUnfoldEntityItem("Pages");
    cy.Createpage("Child_Page");
    cy.wait(1000);
    cy.get(`.t--entity-name:contains(${newPage} Copy)`)
      .trigger("mouseover")
      .click({ force: true });
    cy.wait(2000); // adding wait for query to load
    entityExplorer.SelectEntityByName("get_users", "Queries/JS");
    agHelper.ActionContextMenuWithInPane({
      action: "Move to page",
      subAction: "Child_Page",
      toastToValidate: "moved to page",
    });
    cy.runQuery();
    cy.wait(2000);
    cy.get(`.t--entity-name:contains(${newPage} Copy)`)
      .trigger("mouseover")
      .click({ force: true });
    cy.wait(2000);
    entityExplorer.SelectEntityByName("JSObject1", "Queries/JS");
    entityExplorer.ActionContextMenuByEntityName({
      entityNameinLeftSidebar: "JSObject1",
      action: "Move to page",
      subAction: "Child_Page",
      toastToValidate: "moved to page",
    });
    cy.wait(2000);
    entityExplorer.NavigateToSwitcher("Widgets");
    cy.get(explorer.addWidget).click({ force: true });
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
    cy.EnableAllCodeEditors();
    cy.get(`.t--property-control-defaultvalue ${dynamicInputLocators.input}`)
      .last()
      .click({ force: true })
      .type("{{get_users.data[0].name}}", {
        parseSpecialCharSequences: false,
      });
    cy.wait(2000);
  });

  it("5. Commit and push changes, validate data binding on all pages in edit and deploy mode on tempBranch", () => {
    // commit and push changes
    cy.get(homePageLocators.publishButton).click();
    cy.get(gitSyncLocators.commitCommentInput).type("Initial Commit");
    cy.get(gitSyncLocators.commitButton).click();
    cy.wait(8000);
    cy.get(gitSyncLocators.closeGitSyncModal).click();
    // verfiy data binding on all pages in deploy mode
    cy.wait(4000);
    cy.latestDeployPreview();
    cy.wait(2000);
    cy.get(".bp3-input").should("be.visible");
    cy.get(".bp3-input")
      .first()
      .invoke("val")
      .should("be.oneOf", ["Success", "Test user 7"]);
    cy.get(".bp3-input")
      .last()
      .invoke("val")
      .should("be.oneOf", ["Success", "Test user 7"]);
    cy.get(".t--page-switch-tab")
      .contains(`${pageName}`)
      .click({ force: true });
    cy.readTabledataPublish("0", "1").then((cellData) => {
      expect(cellData).to.be.equal("New Config");
    });
    cy.get(".t--page-switch-tab")
      .contains(`${pageName} Copy`)
      .click({ force: true });
    cy.readTabledataPublish("0", "1").then((cellData) => {
      expect(cellData).to.be.equal("New Config");
    });
    cy.get(".t--page-switch-tab").contains(`${newPage}`).click({ force: true });
    cy.wait(2000);
    cy.get(".bp3-input")
      .first()
      .invoke("val")
      .should("be.oneOf", ["morpheus", "This is a test"]);
    cy.get(".bp3-input")
      .last()
      .invoke("val")
      .should("be.oneOf", ["morpheus", "This is a test"]);
    cy.get(".t--page-switch-tab")
      .contains(`${newPage} Copy`)
      .click({ force: true });
    cy.wait(2000);
    cy.get(".bp3-input")
      .first()
      .invoke("val")
      .should("be.oneOf", ["morpheus", "This is a test"]);
    cy.get(".bp3-input")
      .last()
      .invoke("val")
      .should("be.oneOf", ["morpheus", "This is a test"]);
    cy.get(commonlocators.backToEditor).click();
    cy.wait(2000);
    // verfiy data binding on all pages in edit mode
    /* cy.get(".t--draggable-inputwidgetv2").first().find(".bp3-input").should("have.value", "morpheus");
     cy.get(".t--draggable-inputwidgetv2")
      .last()
      .find(".bp3-input")
      .should("have.value", "This is a test");
    cy.get(`.t--entity-item:contains(Child_Page)`)
      .first()
      .click();
    cy.wait("@getPage");
    cy.reload();
    cy.wait(3000);
    cy.get(".bp3-input")
      .first()
      .should("have.value", "Success");
    cy.get(".bp3-input")
      .last()
      .should("have.value", "Test user 7");
    cy.get(`.t--entity-item:contains(${newPage})`)
      .first()
      .click();
    cy.wait("@getPage");
    cy.get(".t--draggable-inputwidgetv2").first().find(".bp3-input").should("have.value", "morpheus");
     cy.get(".t--draggable-inputwidgetv2")
      .last()
      .find(".bp3-input")
      .should("have.value", "This is a test");

    cy.get(`.t--entity-item:contains(${pageName} Copy)`).click();
    cy.wait("@getPage");
    cy.readTabledataPublish("0", "1").then((cellData) => {
      expect(cellData).to.be.equal("New Config");
    });
    cy.get(`.t--entity-item:contains(${pageName})`)
      .first()
      .click();
    cy.wait("@getPage");
    cy.readTabledataPublish("0", "1").then((cellData) => {
      expect(cellData).to.be.equal("New Config");
    }); */
  });

  it("6. Switch to master and verify no uncommitted changes should be shown on master", () => {
    cy.switchGitBranch("master");
    cy.wait(2000);
    // verify commit input box is disabled
    cy.get(homePageLocators.publishButton).click();
    cy.get(gitSyncLocators.commitCommentInput)
      .should("be.disabled")
      .and("have.text", "No changes to commit");
    cy.get(gitSyncLocators.closeGitSyncModal).click();
  });

  it("7. Switch to tempBranch , Clone the Child_Page, change it's visiblity to hidden and deploy, merge to master", () => {
    cy.switchGitBranch(tempBranch);
    cy.wait(2000);

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
    cy.wait("@getPage");
    cy.get(homePageLocators.publishButton).click();
    cy.get(gitSyncLocators.commitCommentInput).type("Initial Commit");
    cy.get(gitSyncLocators.commitButton).click();
    cy.wait(8000);
    cy.get(gitSyncLocators.closeGitSyncModal).click();
    cy.wait(2000);
    cy.merge(mainBranch);
    cy.get(gitSyncLocators.closeGitSyncModal).click();
    cy.wait(2000);
    cy.latestDeployPreview();
    // verify page is hidden on deploy mode
    agHelper.AssertContains("Child_Page Copy", "not.exist");
    deployMode.NavigateBacktoEditor();
  });

  it("8. Verify Page visiblity on master in edit and deploy mode", () => {
    cy.switchGitBranch(mainBranch);
    cy.wait(2000);
    cy.latestDeployPreview();
    agHelper.AssertContains("Child_Page Copy", "not.exist");
    deployMode.NavigateBacktoEditor();
  });

  it("9. Create new branch, delete a page and merge back to master, verify page is deleted on master", () => {
    //cy.createGitBranch(tempBranch1);
    gitSync.CreateGitBranch(tempBranch1, true);
    // delete page from page settings
    cy.Deletepage("Child_Page Copy");
    cy.get(homePageLocators.publishButton).click();
    cy.get(gitSyncLocators.commitCommentInput).type("Initial Commit");
    cy.get(gitSyncLocators.commitButton).click();
    cy.wait(8000);
    cy.get(gitSyncLocators.closeGitSyncModal).click();
    cy.wait(2000);
    cy.merge(mainBranch);
    cy.get(gitSyncLocators.closeGitSyncModal).click();
    // verify Child_Page is not on master
    cy.switchGitBranch(mainBranch);
    cy.CheckAndUnfoldEntityItem("Pages");
    cy.get(`.t--entity-name:contains("Child_Page Copy")`).should("not.exist");
    // create another branch and verify deleted page doesn't exist on it
    gitSync.CreateGitBranch(tempBranch0, true);
    cy.CheckAndUnfoldEntityItem("Pages");
    cy.get(`.t--entity-name:contains("Child_Page Copy")`).should("not.exist");
  });

  it("10. Import app from git and verify page order should not change", () => {
    cy.get(homePageLocators.homeIcon).click();
    cy.get(homePageLocators.optionsIcon).first().click();
    cy.get(homePageLocators.workspaceImportAppOption).click({ force: true });
    cy.get(".t--import-json-card").next().click();
    // import application from git
    cy.importAppFromGit(repoName);
    cy.wait(2000);
    // verify page order remains same as in orignal app
    cy.CheckAndUnfoldEntityItem("Pages");
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
});
