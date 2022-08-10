const pages = require("../../../../../locators/Pages.json");
const generatePage = require("../../../../../locators/GeneratePage.json");
const explorer = require("../../../../../locators/explorerlocators.json");
const apiwidget = require("../../../../../locators/apiWidgetslocator.json");
const dynamicInputLocators = require("../../../../../locators/DynamicInput.json");
const queryLocators = require("../../../../../locators/QueryEditor.json");
const commonlocators = require("../../../../../locators/commonlocators.json");
import gitSyncLocators from "../../../../../locators/gitSyncLocators";
import ApiEditor from "../../../../../locators/ApiEditor";
import homePage from "../../../../../locators/HomePage";
import datasource from "../../../../../locators/DatasourcesEditor.json";
import { ObjectsRegistry } from "../../../../../support/Objects/Registry";
const ee = ObjectsRegistry.EntityExplorer;
const newPage = "ApiCalls_1";
const pageName = "crudpage_1";
const tempBranch = "feat/tempBranch";
const tempBranch1 = "feat/testing";
const tempBranch0 = "test/tempBranch0";
const mainBranch = "master";
let datasourceName;
let repoName;

describe("Git sync apps", function() {
  before(() => {
    // cy.NavigateToHome();
    // cy.createWorkspace();
    //  cy.wait("@createWorkspace").then((interception) => {
    //    const newWorkspaceName = interception.response.body.data.name;
    //    cy.CreateAppForWorkspace(newWorkspaceName, "gitSyncApp");
  });
  it("1. Generate postgreSQL crud page , connect to git, clone the page, rename page with special character in it", () => {
    cy.NavigateToHome();
    cy.get(homePage.createNew)
      .first()
      .click({ force: true });

    cy.wait("@createNewApplication").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      201,
    );

    // create New App and  generate Postgres CRUD page
    cy.get(generatePage.generateCRUDPageActionCard).click();

    cy.get(generatePage.selectDatasourceDropdown).click();

    cy.contains("Connect New Datasource").click();

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
      200,
    );

    cy.wait("@getDatasourceStructure").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );

    cy.get(generatePage.selectTableDropdown).click();

    cy.get(generatePage.dropdownOption)
      .contains("public.configs")
      .click();

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

    cy.get("span:contains('GOT IT')").click();
    // connect app to git
    cy.generateUUID().then((uid) => {
      repoName = uid;

      cy.createTestGithubRepo(repoName);
      cy.connectToGitRepo(repoName);
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
    cy.Createpage(newPage);
    cy.get(`.t--entity-item:contains(${newPage})`).click();
    cy.wait(1000);
    // create a get api call
    cy.NavigateToAPI_Panel();
    cy.wait(2000);
    cy.CreateAPI("get_data");
    // creating get request using echo
    cy.get(apiwidget.resourceUrl)
      .first()
      .click({ force: true })
      .type("https://mock-api.appsmith.com/echo/get", {
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
    cy.get(".bp3-icon-chevron-left").click();
    // curl import
    cy.get(pages.integrationCreateNew)
      .should("be.visible")
      .click({ force: true });
    cy.get(ApiEditor.curlImage).click({ force: true });
    cy.get("textarea").type(
      'curl -d \'{"name":"morpheus","job":"leader"}\' -H Content-Type:application/json -X POST https://mock-api.appsmith.com/echo/post',
      {
        force: true,
        parseSpecialCharSequences: false,
      },
    );
    cy.importCurl();
    cy.RunAPI();
    cy.ResponseStatusCheck("201 CREATED");
    cy.get("@curlImport").then((response) => {
      cy.expect(response.response.body.responseMeta.success).to.eq(true);
      cy.get(apiwidget.ApiName)
        .invoke("text")
        .then((text) => {
          const someText = text;
          expect(someText).to.equal(response.response.body.data.name);
        });
    });
    cy.get(explorer.addWidget).click();
    // bind input widgets to the api calls responses
    cy.dragAndDropToCanvas("inputwidgetv2", { x: 300, y: 300 });
    cy.get(".t--widget-inputwidgetv2").should("exist");
    cy.EnableAllCodeEditors();
    cy.get(dynamicInputLocators.input)
      .eq(1)
      .click({ force: true })
      .type("{{Api1.data.body.name}}", { parseSpecialCharSequences: false });
    cy.dragAndDropToCanvas("inputwidgetv2", { x: 300, y: 500 });
    cy.get(".t--widget-inputwidgetv2").should("exist");
    cy.EnableAllCodeEditors();
    cy.get(dynamicInputLocators.input)
      .eq(1)
      .click({ force: true })
      .type("{{get_data.data.headers.info}}", {
        parseSpecialCharSequences: false,
      });
    cy.wait(2000);
    // clone the page from page settings
    cy.xpath("//span[contains(@class,'entity-right-icon')]").click({
      force: true,
    });
    cy.xpath("(//button[@type='button'])")
      .eq(9)
      .click();
    cy.wait("@clonePage").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      201,
    );
    cy.get(`.t--entity-item:contains(${newPage} Copy)`).click();
    cy.wait("@getPage");
  });
  it("3. Commit and push changes, validate data binding on all pages in edit and deploy mode on master", () => {
    // verfiy data binding on all pages in edit mode
    cy.get(".t--draggable-inputwidgetv2")
      .first()
      .find(".bp3-input")
      .should("have.value", "morpheus");

    cy.get(".t--draggable-inputwidgetv2")
      .last()
      .find(".bp3-input")
      .should("have.value", "This is a test");
    cy.get(`.t--entity-item:contains(${newPage})`)
      .first()
      .click();
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
    cy.get(`.t--entity-item:contains(${pageName})`)
      .first()
      .click();
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
    cy.get(".t--page-switch-tab")
      .contains(`${newPage}`)
      .click({ force: true });
    cy.get(".bp3-input")
      .first()
      .should("have.value", "morpheus");
    cy.get(".bp3-input")
      .eq(1)
      .should("have.value", "This is a test");
    cy.get(".t--page-switch-tab")
      .contains(`${newPage} Copy`)
      .click({ force: true });
    cy.get(".bp3-input")
      .first()
      .should("have.value", "morpheus");
    cy.get(".bp3-input")
      .eq(1)
      .should("have.value", "This is a test");
    cy.get(commonlocators.backToEditor).click();
    cy.wait(2000);
  });
  it("4. Create a new branch tempBranch, add jsObject and datasource query, move them to new page i.e. Child_Page and bind to widgets", () => {
    cy.createGitBranch(tempBranch);
    cy.wait(1000);
    // create jsObject and rename it
    cy.createJSObject('return "Success";');
    cy.wait(2000);
    // create postgres select query
    //cy.CheckAndUnfoldEntityItem("DATASOURCES");
    cy.NavigateToQueryEditor();
    cy.NavigateToActiveTab();
    cy.get(datasource.datasourceCard)
      .contains(datasourceName)
      .scrollIntoView()
      .should("be.visible")
      .closest(datasource.datasourceCard)
      .within(() => {
        cy.get(datasource.createQuery).click();
      });
    cy.get(queryLocators.queryNameField).type("get_users");
    cy.get(queryLocators.switch)
      .last()
      .click({ force: true });
    cy.get(queryLocators.templateMenu).click();
    cy.get(queryLocators.query).click({ force: true });
    // writing query to get the schema
    cy.get(".CodeMirror textarea")
      .first()
      .focus()
      .type("SELECT * FROM users ORDER BY id LIMIT 10;", {
        force: true,
        parseSpecialCharSequences: false,
      });
    cy.WaitAutoSave();
    cy.runQuery();
    // create a new page
    cy.CheckAndUnfoldEntityItem("PAGES");
    cy.Createpage("Child_Page");
    cy.wait(1000);
    cy.get(`.t--entity-name:contains(${newPage} Copy)`)
      .trigger("mouseover")
      .click({ force: true });
    // move jsObject and postgres query to new page
    cy.CheckAndUnfoldEntityItem("QUERIES/JS");
    ee.ActionContextMenuByEntityName("get_users", "Move to page", "Child_Page");
    cy.wait(2000);
    cy.get(`.t--entity-name:contains(${newPage} Copy)`)
      .trigger("mouseover")
      .click({ force: true });
    ee.ActionContextMenuByEntityName("JSObject1", "Move to page", "Child_Page");
    cy.wait(2000);
    cy.get(explorer.addWidget).click();
    // bind input widgets to the jsObject and query response
    cy.dragAndDropToCanvas("inputwidgetv2", { x: 300, y: 300 });
    cy.get(".t--widget-inputwidgetv2").should("exist");
    cy.EnableAllCodeEditors();
    cy.get(dynamicInputLocators.input)
      .eq(1)
      .click({ force: true })
      .type("{{JSObject1.myFun1()}}", { parseSpecialCharSequences: false });
    cy.dragAndDropToCanvas("inputwidgetv2", { x: 300, y: 500 });
    cy.get(".t--widget-inputwidgetv2").should("exist");
    cy.EnableAllCodeEditors();
    cy.get(dynamicInputLocators.input)
      .eq(1)
      .click({ force: true })
      .type("{{get_users.data[0].name}}", {
        parseSpecialCharSequences: false,
      });
    cy.wait(2000);
  });
  it("5. Commit and push changes, validate data binding on all pages in edit and deploy mode on tempBranch", () => {
    // commit and push changes
    cy.get(homePage.publishButton).click();
    cy.get(gitSyncLocators.commitCommentInput).type("Initial Commit");
    cy.get(gitSyncLocators.commitButton).click();
    cy.wait(8000);
    cy.get(gitSyncLocators.closeGitSyncModal).click();
    // verfiy data binding on all pages in deploy mode
    cy.latestDeployPreview();
    cy.get(".bp3-input")
      .first()
      .should("have.value", "Success");
    cy.get(".bp3-input")
      .eq(1)
      .should("have.value", "Test user 7");
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
    cy.get(".t--page-switch-tab")
      .contains(`${newPage}`)
      .click({ force: true });
    cy.get(".bp3-input")
      .first()
      .should("have.value", "morpheus");
    cy.get(".bp3-input")
      .eq(1)
      .should("have.value", "This is a test");
    cy.get(".t--page-switch-tab")
      .contains(`${newPage} Copy`)
      .click({ force: true });
    cy.get(".bp3-input")
      .first()
      .should("have.value", "morpheus");
    cy.get(".bp3-input")
      .eq(1)
      .should("have.value", "This is a test");
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
      .eq(1)
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
    cy.get(homePage.publishButton).click();
    cy.get(".t--commit-comment-input")
      .should("be.disabled")
      .and("have.text", "No changes to commit");
    cy.get(gitSyncLocators.closeGitSyncModal).click();
  });
  it("7. Switch to tempBranch , Clone the Child_Page, change it's visiblity to hidden and deploy, merge to master", () => {
    cy.switchGitBranch(tempBranch);
    cy.wait(2000);
    //  clone the Child_Page
    cy.CheckAndUnfoldEntityItem("PAGES");
    cy.get(`.t--entity-item:contains(Child_Page)`).within(() => {
      cy.get(".t--context-menu").click({ force: true });
    });
    cy.selectAction("Clone");
    cy.wait("@clonePage").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      201,
    );
    // change cloned page visiblity to hidden
    cy.CheckAndUnfoldEntityItem("PAGES");

    cy.get(`.t--entity-item:contains(Child_Page Copy)`).within(() => {
      cy.get(".t--context-menu").click({ force: true });
    });
    cy.selectAction("Hide");

    cy.get(`.t--entity-item:contains(Child_Page)`)
      .first()
      .click();
    cy.wait("@getPage");
    cy.get(homePage.publishButton).click();
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
    cy.get(".t--page-switch-tab").should("not.contain", "Child_Page Copy");
    cy.get(commonlocators.backToEditor).click();
    cy.wait(2000);
  });
  it("8. Verify Page visiblity on master in edit and deploy mode", () => {
    cy.switchGitBranch(mainBranch);
    cy.wait(2000);
    cy.latestDeployPreview();
    cy.get(".t--page-switch-tab").should("not.contain", "Child_Page Copy");
    cy.get(commonlocators.backToEditor).click();
    cy.wait(2000);
  });
  it("9. Create new branch, delete a page and merge back to master, verify page is deleted on master", () => {
    cy.createGitBranch(tempBranch1);
    // delete page from page settings
    cy.Deletepage("Child_Page Copy");
    cy.get(homePage.publishButton).click();
    cy.get(gitSyncLocators.commitCommentInput).type("Initial Commit");
    cy.get(gitSyncLocators.commitButton).click();
    cy.wait(8000);
    cy.get(gitSyncLocators.closeGitSyncModal).click();
    cy.wait(2000);
    cy.merge(mainBranch);
    cy.get(gitSyncLocators.closeGitSyncModal).click();
    // verify Child_Page is not on master
    cy.switchGitBranch(mainBranch);
    cy.CheckAndUnfoldEntityItem("PAGES");
    cy.get(`.t--entity-name:contains("Child_Page Copy")`).should("not.exist");
    // create another branch and verify deleted page doesn't exist on it
    cy.createGitBranch(tempBranch0);
    cy.CheckAndUnfoldEntityItem("PAGES");
    cy.get(`.t--entity-name:contains("Child_Page Copy")`).should("not.exist");
  });
  it("10. Import app from git and verify page order should not change", () => {
    cy.get(homePage.homeIcon).click();
    cy.get(homePage.optionsIcon)
      .first()
      .click();
    cy.get(homePage.workspaceImportAppOption).click({ force: true });
    cy.get(".t--import-json-card")
      .next()
      .click();
    // import application from git
    cy.importAppFromGit(repoName);
    cy.wait(2000);
    // verify page order remains same as in orignal app
    cy.CheckAndUnfoldEntityItem("PAGES");
    cy.get(".t--entity-item")
      .eq(1)
      .contains("crudpage_1");
    cy.get(".t--entity-item")
      .eq(2)
      .contains("crudpage_1 Copy");
    cy.get(".t--entity-item")
      .eq(3)
      .contains("ApiCalls_1");
    cy.get(".t--entity-item")
      .eq(4)
      .contains("ApiCalls_1 Copy");
    cy.get(".t--entity-item")
      .eq(5)
      .contains("Child_Page");
  });
});
