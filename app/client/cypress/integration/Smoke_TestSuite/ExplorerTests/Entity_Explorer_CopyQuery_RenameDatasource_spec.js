const queryLocators = require("../../../locators/QueryEditor.json");
const datasource = require("../../../locators/DatasourcesEditor.json");
const apiwidget = require("../../../locators/apiWidgetslocator.json");
const commonlocators = require("../../../locators/commonlocators.json");

const pageid = "MyPage";
let updatedName;
let datasourceName;

describe("Entity explorer tests related to copy query", function() {
  it("Create a query with dataSource in explorer", function() {
    cy.NavigateToDatasourceEditor();
    cy.get(datasource.PostgreSQL).click();

    cy.getPluginFormsAndCreateDatasource();

    cy.fillPostgresDatasourceForm();

    cy.testSaveDatasource();

    cy.NavigateToQueryEditor();

    cy.get("@createDatasource").then(httpResponse => {
      datasourceName = httpResponse.response.body.data.name;

      cy.get(".t--datasource-name")
        .contains(datasourceName)
        .click();
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

    cy.get("@createDatasource").then(httpResponse => {
      datasourceName = httpResponse.response.body.data.name;

      cy.get(apiwidget.propertyList).then(function($lis) {
        expect($lis).to.have.length(3);
        expect($lis.eq(0)).to.contain("{{Query1.isLoading}}");
        expect($lis.eq(1)).to.contain("{{Query1.data}}");
        expect($lis.eq(2)).to.contain("{{Query1.run()}}");
      });
    });
  });

  it("Create a page and copy query in explorer", function() {
    cy.Createpage(pageid);
    cy.GlobalSearchEntity("Query1");
    cy.xpath(apiwidget.popover)
      .last()
      .should("be.hidden")
      .invoke("show")
      .click({ force: true });
    cy.copyEntityToPage(pageid);
    cy.SearchEntityandOpen("Query1Copy");
    cy.runQuery();
    cy.get(apiwidget.propertyList).then(function($lis) {
      expect($lis).to.have.length(3);
      expect($lis.eq(0)).to.contain("{{Query1Copy.isLoading}}");
      expect($lis.eq(1)).to.contain("{{Query1Copy.data}}");
      expect($lis.eq(2)).to.contain("{{Query1Copy.run()}}");
    });
  });

  it("Delete query and rename datasource in explorer", function() {
    cy.deleteQuery();
    cy.get(commonlocators.entityExplorersearch).clear();
    cy.NavigateToDatasourceEditor();
    cy.get(datasource.PostgresEntity).click();
    cy.GlobalSearchEntity(`${datasourceName}`);
    cy.get(`.t--entity-name:contains(${datasourceName})`).click();
    cy.generateUUID().then(uid => {
      updatedName = uid;
      cy.log("complete uid :" + updatedName);
      updatedName = uid.replace(/-/g, "_").slice(1, 15);
      cy.log("sliced id :" + updatedName);
      cy.EditEntityNameByDoubleClick(datasourceName, updatedName);
      cy.SearchEntityandOpen(updatedName);
      cy.testSaveDatasource();
      cy.hoverAndClick();
      cy.get(apiwidget.delete).click({ force: true });
      //This is check to make sure if a datasource is active 409
      cy.wait("@deleteDatasource").should(
        "have.nested.property",
        "response.body.responseMeta.status",
        409,
      );
    });
  });
});
