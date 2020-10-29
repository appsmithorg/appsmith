const queryLocators = require("../../../locators/QueryEditor.json");
const datasource = require("../../../locators/DatasourcesEditor.json");
const apiwidget = require("../../../locators/apiWidgetslocator.json");
const commonlocators = require("../../../locators/commonlocators.json");

const pageid = "MyPage";
let datasourceName;

describe("Entity explorer tests related to query and datasource", function() {
  before(() => {
    cy.generateUUID().then(uid => {
      datasourceName = uid;
    });
  });

  it("Create a page/moveQuery/rename/delete in explorer", function() {
    cy.NavigateToDatasourceEditor();
    cy.get(datasource.PostgreSQL).click();

    cy.getPluginFormsAndCreateDatasource();

    cy.fillPostgresDatasourceForm();

    cy.testSaveDatasource();

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

    cy.get(queryLocators.templateMenu).click();
    cy.get(".CodeMirror textarea")
      .first()
      .focus()
      .type("select * from users");

    cy.EvaluateCurrentValue("select * from users");

    cy.get(apiwidget.propertyList).then(function($lis) {
      expect($lis).to.have.length(3);
      expect($lis.eq(0)).to.contain("{{Query1.isLoading}}");
      expect($lis.eq(1)).to.contain("{{Query1.data}}");
      expect($lis.eq(2)).to.contain("{{Query1.run()}}");
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

    cy.contains(".t--datasource-name", datasourceName)
      .find(".t--edit-datasource")
      .click();
    cy.get(".t--delete-datasource").click();
    cy.wait("@deleteDatasource").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
  });
});
