const queryLocators = require("../../../locators/QueryEditor.json");
const datasource = require("../../../locators/DatasourcesEditor.json");
const apiwidget = require("../../../locators/apiWidgetslocator.json");
const commonlocators = require("../../../locators/commonlocators.json");

const pageid = "MyPage";

describe("Entity explorer tests related to query and datasource", function() {
  it("Create a page/moveQuery/rename/delete in explorer", function() {
    cy.NavigateToDatasourceEditor();
    cy.get(datasource.PostgreSQL).click();

    cy.getPluginFormsAndCreateDatasource();

    cy.fillPostgresDatasourceForm();

    cy.testSaveDatasource();

    cy.NavigateToQueryEditor();

    cy.get("@createDatasource").then(httpResponse => {
      const datasourceName = httpResponse.response.body.data.name;

      cy.contains(".t--datasource-name", datasourceName)
        .find(queryLocators.createQuery)
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
      const datasourceName = httpResponse.response.body.data.name;

      cy.get(apiwidget.propertyList).then(function($lis) {
        expect($lis).to.have.length(3);
        expect($lis.eq(0)).to.contain("{{Query1.isLoading}}");
        expect($lis.eq(1)).to.contain("{{Query1.data}}");
        expect($lis.eq(2)).to.contain("{{Query1.run()}}");
      });
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
    cy.get(commonlocators.entityExplorersearch).clear();
    cy.NavigateToDatasourceEditor();
    cy.get("@createDatasource").then(httpResponse => {
      const datasourceName = httpResponse.response.body.data.name;
      cy.GlobalSearchEntity(`${datasourceName}`);
      cy.get(`.t--entity-name:contains(${datasourceName})`).click();
    });
    cy.deleteDataSource();
  });
});
