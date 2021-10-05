/// <reference types="Cypress" />

const queryLocators = require("../../../../locators/QueryEditor.json");
const datasource = require("../../../../locators/DatasourcesEditor.json");
const apiwidget = require("../../../../locators/apiWidgetslocator.json");
const commonlocators = require("../../../../locators/commonlocators.json");
const explorer = require("../../../../locators/explorerlocators.json");
const pages = require("../../../../locators/Pages.json");

const pageid = "MyPage";
let datasourceName;

describe("Entity explorer tests related to query and datasource", function() {
  before(() => {
    cy.generateUUID().then((uid) => {
      datasourceName = uid;
    });
  });

  beforeEach(() => {
    cy.startRoutesForDatasource();
  });

  it("Create a page/moveQuery/rename/delete in explorer", function() {
    cy.NavigateToDatasourceEditor();
    cy.get(datasource.PostgreSQL).click();

    cy.getPluginFormsAndCreateDatasource();

    cy.fillPostgresDatasourceForm();

    cy.testSaveDatasource();

    // checking that conflicting names are not allowed
    cy.get(".t--edit-datasource-name").click();
    cy.get(".t--edit-datasource-name input")
      .clear()
      .type("download", { force: true })
      .blur();
    cy.get(".Toastify").should("contain", "Invalid name");

    // checking a valid name
    cy.get(".t--edit-datasource-name").click();
    cy.get(".t--edit-datasource-name input")
      .clear()
      .type(datasourceName, { force: true })
      .should("have.value", datasourceName)
      .blur();

    cy.NavigateToQueryEditor();
    cy.contains(".t--datasource-name", datasourceName)
      .find(queryLocators.createQuery)
      .click();

    cy.get("@getPluginForm").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );

    /* eslint-disable */
    cy.wait(2000);
    cy.NavigateToQueryEditor();

    cy.contains(".t--datasource-name", datasourceName).click();

    cy.get(".t--edit-datasource-name").click();
    cy.get(".t--edit-datasource-name input")
      .clear()
      .type(`${datasourceName}new`, { force: true })
      .blur();

    cy.contains(commonlocators.entityName, `${datasourceName}new`);

    // reverting the name
    cy.get(".t--edit-datasource-name").click();
    cy.get(".t--edit-datasource-name input")
      .clear()
      .type(`${datasourceName}`, { force: true })
      .blur();

    // going  to the query create page
    cy.contains(commonlocators.entityName, "Query1").click();

    cy.get("@getPluginForm").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );

    // cy.get(queryLocators.templateMenu).click();
    cy.get(".CodeMirror textarea")
      .first()
      .focus()
      .type("select * from users");

    cy.EvaluateCurrentValue("select * from users");
    cy.get(".t--action-name-edit-field").click({ force: true });

    cy.get(`.t--entity.action:contains(Query1)`)
      .scrollIntoView({ force: true })
      .find(explorer.collapse)
      .click({ force: true });
    cy.get(apiwidget.propertyList).then(function($lis) {
      expect($lis).to.have.length(5);
      expect($lis.eq(0)).to.contain("{{Query1.isLoading}}");
      expect($lis.eq(1)).to.contain("{{Query1.data}}");
      expect($lis.eq(2)).to.contain("{{Query1.responseMeta}}");
      expect($lis.eq(3)).to.contain("{{Query1.run()}}");
      expect($lis.eq(4)).to.contain("{{Query1.clear()}}");
    });
    cy.Createpage(pageid);
    cy.GlobalSearchEntity("Query1");
    cy.EditApiNameFromExplorer("MyQuery");
    cy.GlobalSearchEntity("MyQuery");
    cy.xpath(apiwidget.popover)
      .last()
      .should("be.hidden")
      .invoke("show")
      .click({ force: true });
    cy.MoveAPIToPage(pageid);
    cy.SearchEntityandOpen("MyQuery");
    cy.runQuery();

    cy.deleteQuery();
    cy.get(commonlocators.entityExplorersearch).clear({ force: true });
    cy.wait(500);
    cy.NavigateToQueryEditor();
    cy.get(pages.integrationActiveTab)
      .should("be.visible")
      .click({ force: true });
    cy.contains(".t--datasource-name", datasourceName).click();
    cy.get(".t--delete-datasource").click();
    cy.wait("@deleteDatasource").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
  });
});
