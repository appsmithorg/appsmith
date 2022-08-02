const datasource = require("../../../../../locators/DatasourcesEditor.json");
const queryLocators = require("../../../../../locators/QueryEditor.json");
const dynamicInputLocators = require("../../../../../locators/DynamicInput.json");
const explorer = require("../../../../../locators/explorerlocators.json");

describe("Git discard changes:", function() {
  let datasourceName;
  let repoName;
  const query1 = "get_users";
  const query2 = "get_allusers";
  const jsObject = "JSObject1";
  const jsObject2 = "JSObject2";
  const page2 = "Page_2";
  const page3 = "Page_3";

  it("1. Create an app with Query1 and JSObject1, connect it to git", () => {
    // Create new postgres datasource
    cy.NavigateToDatasourceEditor();
    cy.get(datasource.PostgreSQL).click();

    cy.getPluginFormsAndCreateDatasource();

    cy.fillPostgresDatasourceForm();

    cy.testSaveDatasource();

    cy.get("@createDatasource").then((httpResponse) => {
      datasourceName = httpResponse.response.body.data.name;

      cy.get(datasource.datasourceCard)
        .contains(datasourceName)
        .scrollIntoView()
        .should("be.visible")
        .closest(datasource.datasourceCard)
        .within(() => {
          cy.get(datasource.createQuery).click();
        });
    });
    // Create new postgres query
    cy.get(queryLocators.queryNameField).type(`${query1}`);
    cy.get(queryLocators.switch)
      .last()
      .click({ force: true });
    cy.get(queryLocators.templateMenu).click();
    cy.get(queryLocators.query).click({ force: true });
    cy.get(".CodeMirror textarea")
      .first()
      .focus()
      .type("SELECT * FROM users ORDER BY id LIMIT 10;", {
        force: true,
        parseSpecialCharSequences: false,
      });
    cy.WaitAutoSave();
    cy.runQuery();

    cy.CheckAndUnfoldEntityItem("PAGES");
    cy.wait(1000);
    cy.get(".t--entity-item:contains(Page1)")
      .first()
      .click();
    cy.wait("@getPage");
    // bind input widget to postgres query on page1
    cy.get(explorer.addWidget).click();
    cy.dragAndDropToCanvas("inputwidgetv2", { x: 300, y: 300 });
    cy.get(".t--widget-inputwidgetv2").should("exist");
    cy.EnableAllCodeEditors();
    cy.get(dynamicInputLocators.input)
      .eq(1)
      .click({ force: true })
      .type(`{{${query1}.data[0].name}}`, {
        parseSpecialCharSequences: false,
      });
    cy.wait(2000);
    cy.CheckAndUnfoldEntityItem("PAGES");
    cy.Createpage(page2);
    cy.wait(1000);
    cy.get(`.t--entity-item:contains(${page2})`)
      .first()
      .click();
    cy.wait("@getPage");
    cy.createJSObject('return "Success";');
    cy.get(explorer.addWidget).click();
    // bind input widget to JSObject response on page2
    cy.dragAndDropToCanvas("inputwidgetv2", { x: 300, y: 300 });
    cy.get(".t--widget-inputwidgetv2").should("exist");
    cy.EnableAllCodeEditors();
    cy.get(dynamicInputLocators.input)
      .eq(1)
      .click({ force: true })
      .type("{{JSObject1.myFun1()}}", { parseSpecialCharSequences: false });
    cy.get("#switcher--explorer").click({ force: true });
    // connect app to git
    cy.generateUUID().then((uid) => {
      repoName = uid;

      cy.createTestGithubRepo(repoName);
      cy.connectToGitRepo(repoName);
    });
  });

  it("2. Add new datasource query, discard changes, verify query is deleted", () => {
    cy.get(`.t--entity-item:contains("Page1")`)
      .first()
      .click();
    cy.wait("@getPage");
    // create new postgres query
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
    cy.get(queryLocators.queryNameField).type(`${query2}`);
    cy.get(queryLocators.switch)
      .last()
      .click({ force: true });
    cy.get(queryLocators.templateMenu).click();
    cy.get(queryLocators.query).click({ force: true });
    cy.get(".CodeMirror textarea")
      .first()
      .focus()
      .type("SELECT * FROM users;", {
        force: true,
        parseSpecialCharSequences: false,
      });
    cy.WaitAutoSave();
    cy.runQuery();
    // navoigate to Page1
    cy.get(`.t--entity-item:contains(Page1)`)
      .first()
      .click();
    cy.wait("@getPage");
    // discard changes
    cy.gitDiscardChanges();
    cy.wait(5000);
    cy.CheckAndUnfoldEntityItem("QUERIES/JS");
    // verify query2 is not present
    cy.get(`.t--entity-name:contains(${query2})`).should("not.exist");
  });

  it("3. Add new JSObject , discard changes verify JSObject is deleted", () => {
    cy.createJSObject('return "Success";');
    cy.CheckAndUnfoldEntityItem("QUERIES/JS");
    // verify jsObject is not duplicated
    cy.get(`.t--entity-name:contains(${jsObject})`).should("have.length", 1);
    cy.gitDiscardChanges();
    cy.wait(5000);
    cy.CheckAndUnfoldEntityItem("QUERIES/JS");
    // verify jsObject2 is deleted after discarding changes
    cy.get(`.t--entity-name:contains(${jsObject})`).should("not.exist");
  });

  it("4. Delete page2 and trigger discard flow, page2 should be available again", () => {
    cy.Deletepage(page2);
    // verify page is deleted
    cy.CheckAndUnfoldEntityItem("PAGES");
    cy.get(`.t--entity-name:contains(${page2})`).should("not.exist");
    cy.wait(2000);
    cy.gitDiscardChanges();
    cy.wait(5000);
    // verify page2 is recovered back
    cy.get(`.t--entity-name:contains(${page2})`).should("be.visible");
    cy.get(`.t--entity-item:contains(${page2})`)
      .first()
      .click();
    cy.wait("@getPage");
    // verify data binding on page2
    cy.get(".bp3-input").should("have.value", "Success");
  });

  it("5. Delete Query1 and trigger discard flow, Query1 will be recovered", () => {
    // navigate to Page1
    cy.CheckAndUnfoldEntityItem("PAGES");
    cy.get(`.t--entity-item:contains("Page1")`)
      .first()
      .click();
    cy.wait("@getPage");
    // delete query1
    cy.deleteQueryOrJS(query1);
    // verify Query1 is deleted
    cy.get(`.t--entity-name:contains(${query1})`).should("not.exist");
    // discard changes
    cy.gitDiscardChanges();
    cy.wait(5000);
    //verify query1 is recovered
    cy.get(`.t--entity-name:contains(${query1})`).should("be.visible");

    cy.get(".bp3-input").should("have.value", "Test user 7");
  });

  it("6. Delete JSObject1 and trigger discard flow, JSObject1 should be active again", () => {
    // navigate to page2
    cy.CheckAndUnfoldEntityItem("PAGES");
    cy.get(`.t--entity-item:contains(${page2})`)
      .first()
      .click();
    cy.wait("@getPage");
    cy.wait(3000);
    /* create and save jsObject */
    // cy.createJSObject('return "Success";');
    // delete jsObject1
    cy.CheckAndUnfoldEntityItem("QUERIES/JS");
    cy.get(`.t--entity-item:contains(${jsObject})`).within(() => {
      cy.get(".t--context-menu").click({ force: true });
    });
    cy.selectAction("Delete");
    cy.selectAction("Are you sure?");
    cy.get(`.t--entity-name:contains(${jsObject})`).should("not.exist");
    // discard changes
    cy.gitDiscardChanges();
    cy.wait(5000);
    cy.CheckAndUnfoldEntityItem("PAGES");
    cy.get(`.t--entity-item:contains(${page2})`)
      .first()
      .click();
    cy.wait("@getPage");
    cy.wait(3000);
    //verify JSObject is recovered
    cy.get(`.t--entity-name:contains(${jsObject})`).should("exist");
    cy.get(".bp3-input").should("have.value", "Success");
  });

  it("7. Add new page i.e page3, go to page2 & discard changes, verify page3 is removed", () => {
    // create new page page3 and move to page1
    cy.Createpage(page3);
    cy.get(`.t--entity-item:contains(${page2})`)
      .first()
      .click();
    // discard changes
    cy.gitDiscardChanges();
    cy.wait(5000);
    // verify page3 is removed
    cy.CheckAndUnfoldEntityItem("PAGES");
    cy.get(`.t--entity-name:contains("${page3}")`).should("not.exist");
  });

  it(`8. Add new page i.e page3, discard changes should not throw error: "resource not found"`, () => {
    cy.Createpage(page3);
    cy.gitDiscardChanges();
    cy.wait(5000);
    cy.get(`.t--entity-name:contains("${page3}")`).should("not.exist");
  });
});
