/// <reference types="Cypress" />

import EditorNavigation, {
  SidebarButton,
} from "../../../../support/Pages/EditorNavigation";
const apiwidget = require("../../../../locators/apiWidgetslocator.json");
const commonlocators = require("../../../../locators/commonlocators.json");

import {
  dataSources,
  entityExplorer,
  agHelper,
  entityItems,
} from "../../../../support/Objects/ObjectsCore";

const pageid = "MyPage";
let datasourceName;

describe("Entity explorer tests related to query and datasource", function () {
  before(() => {
    cy.generateUUID().then((uid) => {
      datasourceName = uid;
    });
  });

  beforeEach(() => {
    cy.startRoutesForDatasource();
  });

  it("1. Create a page/moveQuery/rename/delete in explorer", function () {
    cy.Createpage(pageid);
    cy.wait(2000);
    cy.get(".t--entity-name").contains("Page1").click({ force: true });
    cy.wait(2000);
    dataSources.NavigateToDSCreateNew();
    dataSources.CreatePlugIn("PostgreSQL");
    dataSources.FillPostgresDSForm();
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

    cy.testSaveDatasource();
    cy.NavigateToActiveDSQueryPane(datasourceName);

    dataSources.navigateToDatasource(datasourceName);
    agHelper.RenameWithInPane(`${datasourceName}new`, false);
    cy.contains(dataSources._datasourceCard, `${datasourceName}new`);

    // reverting the name
    agHelper.RenameWithInPane(datasourceName, false);

    EditorNavigation.ViaSidebar(SidebarButton.Pages);

    // going  to the query create page
    cy.CheckAndUnfoldEntityItem("Queries/JS");
    cy.contains(commonlocators.entityName, "Query1").click();

    cy.wait("@getPluginForm").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );

    dataSources.EnterQuery("select * from users");

    cy.EvaluateCurrentValue("select * from users");
    cy.get(".t--action-name-edit-field").click({ force: true });
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
    cy.get(".t--entity-property-close").click(); //closing Bindings overlay
    entityExplorer.ActionContextMenuByEntityName({
      entityNameinLeftSidebar: "Query1",
      action: "Edit name",
    });
    cy.EditApiNameFromExplorer("MyQuery");
    entityExplorer.ActionContextMenuByEntityName({
      entityNameinLeftSidebar: "MyQuery",
      action: "Move to page",
      subAction: pageid,
      toastToValidate: "action moved to page",
    });
    cy.wait(2000);
    entityExplorer.ExpandCollapseEntity("Queries/JS");
    entityExplorer.SelectEntityByName("MyQuery");
    cy.wait(2000);
    cy.runQuery();

    //deleteQuery & DS
    agHelper.ActionContextMenuWithInPane({
      action: "Delete",
      entityType: entityItems.Query,
    });
    dataSources.DeleteDatasourceFromWithinDS(datasourceName);
  });
});
