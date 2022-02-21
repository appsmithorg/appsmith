const queryLocators = require("../../../../locators/QueryEditor.json");
const datasource = require("../../../../locators/DatasourcesEditor.json");
const apiwidget = require("../../../../locators/apiWidgetslocator.json");
const commonlocators = require("../../../../locators/commonlocators.json");
const explorer = require("../../../../locators/explorerlocators.json");
import { AggregateHelper } from "../../../../support/Pages/AggregateHelper";
const agHelper = new AggregateHelper();

const pageid = "MyPage";
let updatedName;
let datasourceName;

describe("Entity explorer tests related to copy query", function() {
  beforeEach(() => {
    cy.startRoutesForDatasource();
  });

  it("1. Create a query with dataSource in explorer", function() {
    cy.Createpage(pageid);
    cy.get(".t--entity-name")
      .contains("Page1")
      .click();
    cy.wait(2000);
    cy.NavigateToDatasourceEditor();
    cy.get(datasource.PostgreSQL).click();
    cy.getPluginFormsAndCreateDatasource();
    cy.fillPostgresDatasourceForm();
    cy.testSaveDatasource();

    cy.get("@createDatasource").then((httpResponse) => {
      datasourceName = httpResponse.response.body.data.name;
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
    cy.get("@createDatasource").then((httpResponse) => {
      datasourceName = httpResponse.response.body.data.name;

      agHelper.ActionContextMenuByEntityName("Query1", "Show Bindings");
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

  it("2. Create a page and copy query in explorer", function() {
    cy.get(".t--entity-name")
      .contains("Page1")
      .click();
    agHelper.ActionContextMenuByEntityName("Query1", "Copy to page", pageid);
    cy.get(".t--entity-name")
      .contains("Query1")
      .click({ force: true });
    cy.runQuery();
    agHelper.ActionContextMenuByEntityName("Query1", "Show Bindings");
    cy.get(apiwidget.propertyList).then(function($lis) {
      expect($lis.eq(0)).to.contain("{{Query1.isLoading}}");
      expect($lis.eq(1)).to.contain("{{Query1.data}}");
      expect($lis.eq(2)).to.contain("{{Query1.responseMeta}}");
      expect($lis.eq(3)).to.contain("{{Query1.run()}}");
      expect($lis.eq(4)).to.contain("{{Query1.clear()}}");
    });
  });

  it("3. Delete query and rename datasource in explorer", function() {
    cy.get(".t--entity-name")
      .contains("Page1")
      .click();
    cy.wait(2000);
    cy.generateUUID().then((uid) => {
      updatedName = uid;
      cy.log("complete uid :" + updatedName);
      updatedName = uid.replace(/-/g, "_").slice(1, 15);
      cy.log("sliced id :" + updatedName);
      cy.EditEntityNameByDoubleClick(datasourceName, updatedName);
      cy.wait(2000);
      cy.hoverAndClick();
      cy.get(apiwidget.delete).click({ force: true });
      cy.get("[data-cy=t--confirm-modal-btn]").click();
      //This is check to make sure if a datasource is active 409
      cy.wait("@deleteDatasource").should(
        "have.nested.property",
        "response.body.responseMeta.status",
        409,
      );
    });

    cy.get(".t--entity-name")
      .contains("Query1")
      .click();
    agHelper.ActionContextMenuByEntityName("Query1", "Delete");
  });
});
