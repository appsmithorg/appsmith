const queryLocators = require("../../../../locators/QueryEditor.json");
const apiwidget = require("../../../../locators/apiWidgetslocator.json");
import {
  entityExplorer,
  dataSources,
  entityItems,
} from "../../../../support/Objects/ObjectsCore";

const pageid = "MyPage";
let updatedName;
let datasourceName;

describe("Entity explorer tests related to copy query", function () {
  beforeEach(() => {
    cy.startRoutesForDatasource();
  });

  // afterEach(function() {
  //   if (this.currentTest.state === "failed") {
  //     Cypress.runner.stop();
  //   }
  // });

  it("1. Create a query with dataSource in explorer, Create new Page", function () {
    cy.Createpage(pageid);
    entityExplorer.SelectEntityByName("Page1");
    dataSources.CreateDataSource("Postgres");

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

    dataSources.EnterQuery("select * from users");

    cy.EvaluateCurrentValue("select * from users");
    cy.get(".t--action-name-edit-field").click({ force: true });
    cy.get("@saveDatasource").then((httpResponse) => {
      datasourceName = httpResponse.response.body.data.name;
      entityExplorer.ExpandCollapseEntity("Queries/JS");
      entityExplorer.ActionContextMenuByEntityName({
        entityNameinLeftSidebar: "Query1",
        action: "Show bindings",
      });
      cy.get(apiwidget.propertyList).then(function ($lis) {
        expect($lis).to.have.length(5);
        expect($lis.eq(0)).to.contain("{{Query1.isLoading}}");
        expect($lis.eq(1)).to.contain("{{Query1.data}}");
        expect($lis.eq(2)).to.contain("{{Query1.responseMeta}}");
        expect($lis.eq(3)).to.contain("{{Query1.run()}}");
        expect($lis.eq(4)).to.contain("{{Query1.clear()}}");
      });
    });
  });

  it("2. Copy query in explorer to new page & verify Bindings are copied too", function () {
    entityExplorer.SelectEntityByName("Query1", "Queries/JS");
    entityExplorer.ActionContextMenuByEntityName({
      entityNameinLeftSidebar: "Query1",
      action: "Copy to page",
      subAction: pageid,
      toastToValidate: "copied to page",
    });
    entityExplorer.ExpandCollapseEntity("Queries/JS");
    entityExplorer.SelectEntityByName("Query1");
    cy.runQuery();
    entityExplorer.ActionContextMenuByEntityName({
      entityNameinLeftSidebar: "Query1",
      action: "Show bindings",
    });
    cy.get(apiwidget.propertyList).then(function ($lis) {
      expect($lis.eq(0)).to.contain("{{Query1.isLoading}}");
      expect($lis.eq(1)).to.contain("{{Query1.data}}");
      expect($lis.eq(2)).to.contain("{{Query1.responseMeta}}");
      expect($lis.eq(3)).to.contain("{{Query1.run()}}");
      expect($lis.eq(4)).to.contain("{{Query1.clear()}}");
    });
  });

  it("3. Rename datasource in explorer, Delete query and try to Delete datasource", function () {
    entityExplorer.SelectEntityByName("Page1");
    cy.generateUUID().then((uid) => {
      updatedName = uid;
      cy.log("complete uid :" + updatedName);
      updatedName = uid.replace(/-/g, "_").slice(1, 15);
      cy.log("sliced id :" + updatedName);
      entityExplorer.ExpandCollapseEntity("Queries/JS");
      entityExplorer.ExpandCollapseEntity("Datasources");
      entityExplorer.RenameEntityFromExplorer(datasourceName, updatedName);
      //cy.EditEntityNameByDoubleClick(datasourceName, updatedName);
      cy.wait(1000);
      entityExplorer.ActionContextMenuByEntityName({
        entityNameinLeftSidebar: updatedName,
        action: "Delete",
        toAssertAction: false,
      });
      cy.wait(1000);
      //This is check to make sure if a datasource is active 409
      cy.wait("@deleteDatasource").should(
        "have.nested.property",
        "response.body.responseMeta.status",
        409,
      );
    });
    entityExplorer.SelectEntityByName("Query1", "Queries/JS");
    entityExplorer.ActionContextMenuByEntityName({
      entityNameinLeftSidebar: "Query1",
      action: "Delete",
      entityType: entityItems.Query,
    });
  });
});
