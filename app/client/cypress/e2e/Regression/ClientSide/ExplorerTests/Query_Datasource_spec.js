/// <reference types="Cypress" />

import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";
const apiwidget = require("../../../../locators/apiWidgetslocator.json");

import {
  dataSources,
  entityExplorer,
  agHelper,
  entityItems,
} from "../../../../support/Objects/ObjectsCore";

const pageid = "MyPage";
let datasourceName;

describe(
  "Entity explorer tests related to query and datasource",
  { tags: ["@tag.IDE", "@tag.PropertyPane"] },
  function () {
    before(() => {
      cy.generateUUID().then((uid) => {
        datasourceName = uid;
      });
    });

    beforeEach(() => {
      dataSources.StartDataSourceRoutes();
    });

    it("1. Create a page/moveQuery/rename/delete in explorer", function () {
      cy.Createpage(pageid);
      cy.wait(2000);
      EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
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
      cy.get(".Toastify").should(
        "contain",
        Cypress.env("MESSAGES").INVALID_NAME_ERROR(),
      );

      // checking a valid name
      cy.get(".t--edit-datasource-name").click();
      cy.get(".t--edit-datasource-name input")
        .clear()
        .type(datasourceName, { force: true })
        .should("have.value", datasourceName)
        .blur();

      cy.testSaveDatasource();
      dataSources.CreateQueryAfterDSSaved(datasourceName);

      EditorNavigation.SelectEntityByName(
        datasourceName,
        EntityType.Datasource,
      );
      agHelper.RenameDatasource(`${datasourceName}new`);
      cy.contains(dataSources._datasourceCard, `${datasourceName}new`);

      // reverting the name
      agHelper.RenameDatasource(datasourceName);

      // going  to the query create page
      EditorNavigation.SelectEntityByName("Query1", EntityType.Query);

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
        action: "Rename",
      });
      cy.EditApiNameFromExplorer("MyQuery");
      entityExplorer.ActionContextMenuByEntityName({
        entityNameinLeftSidebar: "MyQuery",
        action: "Move to page",
        subAction: pageid,
        toastToValidate: "action moved to page",
      });
      cy.wait(2000);
      EditorNavigation.SelectEntityByName("MyQuery", EntityType.Query);
      cy.wait(2000);
      cy.runQuery();

      //deleteQuery & DS
      agHelper.ActionContextMenuWithInPane({
        action: "Delete",
        entityType: entityItems.Query,
      });
      dataSources.DeleteDatasourceFromWithinDS(datasourceName);
    });
  },
);
