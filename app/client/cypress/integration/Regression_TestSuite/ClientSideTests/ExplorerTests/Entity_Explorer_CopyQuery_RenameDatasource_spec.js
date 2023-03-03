const queryLocators = require("../../../../locators/QueryEditor.json");
const datasource = require("../../../../locators/DatasourcesEditor.json");
const apiwidget = require("../../../../locators/apiWidgetslocator.json");

import { ObjectsRegistry } from "../../../../support/Objects/Registry";
let ee = ObjectsRegistry.EntityExplorer;

const pageid = "MyPage";
let updatedName;
let datasourceName;

describe("Entity explorer tests related to copy query", function() {
  beforeEach(() => {
    cy.startRoutesForDatasource();
  });

  // afterEach(function() {
  //   if (this.currentTest.state === "failed") {
  //     Cypress.runner.stop();
  //   }
  // });

  it("1. Create a query with dataSource in explorer, Create new Page", function() {
    cy.Createpage(pageid);
    ee.SelectEntityByName("Page1");
    cy.NavigateToDatasourceEditor();
    cy.get(datasource.PostgreSQL).click();
    cy.fillPostgresDatasourceForm();
    cy.testSaveDatasource();

    cy.get("@saveDatasource").then((httpResponse) => {
      datasourceName = httpResponse.response.body.data.name;
      cy.CheckAndUnfoldEntityItem("Datasources");
      cy.NavigateToActiveDSQueryPane(datasourceName);
    });

    cy.get("@getPluginForm").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );

    cy.get(queryLocators.templateMenu).click();
    cy.get(".CodeMirror textarea")
      .first()
      .focus()
      .type("select * from users");

    cy.EvaluateCurrentValue("select * from users");
    cy.get(".t--action-name-edit-field").click({ force: true });
    cy.get("@saveDatasource").then((httpResponse) => {
      datasourceName = httpResponse.response.body.data.name;
      ee.ExpandCollapseEntity("Queries/JS");
      ee.ActionContextMenuByEntityName("Query1", "Show Bindings");
      cy.get(apiwidget.propertyList).then(function($lis) {
        expect($lis).to.have.length(5);
        expect($lis.eq(0)).to.contain("{{Query1.isLoading}}");
        expect($lis.eq(1)).to.contain("{{Query1.data}}");
        expect($lis.eq(2)).to.contain("{{Query1.responseMeta}}");
        expect($lis.eq(3)).to.contain("{{Query1.run()}}");
        expect($lis.eq(4)).to.contain("{{Query1.clear()}}");
      });
    });
  });

  it("2. Copy query in explorer to new page & verify Bindings are copied too", function() {
    ee.SelectEntityByName("Query1", "Queries/JS");
    ee.ActionContextMenuByEntityName("Query1", "Copy to page", pageid);
    ee.ExpandCollapseEntity("Queries/JS");
    ee.SelectEntityByName("Query1");
    cy.runQuery();
    ee.ActionContextMenuByEntityName("Query1", "Show Bindings");
    cy.get(apiwidget.propertyList).then(function($lis) {
      expect($lis.eq(0)).to.contain("{{Query1.isLoading}}");
      expect($lis.eq(1)).to.contain("{{Query1.data}}");
      expect($lis.eq(2)).to.contain("{{Query1.responseMeta}}");
      expect($lis.eq(3)).to.contain("{{Query1.run()}}");
      expect($lis.eq(4)).to.contain("{{Query1.clear()}}");
    });
  });

  it("3. Rename datasource in explorer, Delete query and try to Delete datasource", function() {
    ee.SelectEntityByName("Page1");
    cy.generateUUID().then((uid) => {
      updatedName = uid;
      cy.log("complete uid :" + updatedName);
      updatedName = uid.replace(/-/g, "_").slice(1, 15);
      cy.log("sliced id :" + updatedName);
      ee.ExpandCollapseEntity("Queries/JS");
      ee.ExpandCollapseEntity("Datasources");
      ee.RenameEntityFromExplorer(datasourceName, updatedName);
      //cy.EditEntityNameByDoubleClick(datasourceName, updatedName);
      cy.wait(1000);
      ee.ActionContextMenuByEntityName(updatedName, "Delete", "Are you sure?");
      cy.wait(1000);
      //This is check to make sure if a datasource is active 409
      cy.wait("@deleteDatasource").should(
        "have.nested.property",
        "response.body.responseMeta.status",
        409,
      );
    });
    ee.SelectEntityByName("Query1", "Queries/JS");
    ee.ActionContextMenuByEntityName("Query1", "Delete", "Are you sure?");
  });
});
