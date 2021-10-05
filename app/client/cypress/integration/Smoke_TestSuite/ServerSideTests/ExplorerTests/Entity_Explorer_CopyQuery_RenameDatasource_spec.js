const queryLocators = require("../../../../locators/QueryEditor.json");
const datasource = require("../../../../locators/DatasourcesEditor.json");
const apiwidget = require("../../../../locators/apiWidgetslocator.json");
const commonlocators = require("../../../../locators/commonlocators.json");
const explorer = require("../../../../locators/explorerlocators.json");

const pageid = "MyPage";
let updatedName;
let datasourceName;

describe("Entity explorer tests related to copy query", function() {
  beforeEach(() => {
    cy.startRoutesForDatasource();
  });

  it("Create a query with dataSource in explorer", function() {
    cy.NavigateToDatasourceEditor();
    cy.get(datasource.PostgreSQL).click();

    cy.getPluginFormsAndCreateDatasource();

    cy.fillPostgresDatasourceForm();

    cy.testSaveDatasource();

    cy.NavigateToQueryEditor();

    cy.get("@createDatasource").then((httpResponse) => {
      datasourceName = httpResponse.response.body.data.name;

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
    cy.get(".t--action-name-edit-field").click({ force: true });
    cy.get("@createDatasource").then((httpResponse) => {
      datasourceName = httpResponse.response.body.data.name;

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
    cy.SearchEntityandOpen("Query1");
    cy.runQuery();
    cy.get(`.t--entity.action:contains(Query1)`).should("have.length", 2);
    cy.get(`.t--entity.action:contains(Query1)`)
      .find(explorer.collapse)
      .click({ multiple: true });
    cy.get(apiwidget.propertyList).then(function($lis) {
      expect($lis.eq(0)).to.contain("{{Query1.isLoading}}");
      expect($lis.eq(1)).to.contain("{{Query1.data}}");
      expect($lis.eq(2)).to.contain("{{Query1.responseMeta}}");
      expect($lis.eq(3)).to.contain("{{Query1.run()}}");
      expect($lis.eq(4)).to.contain("{{Query1.clear()}}");
    });
  });

  it("Delete query and rename datasource in explorer", function() {
    cy.get(commonlocators.entityExplorersearch).clear({ force: true });
    cy.NavigateToDatasourceEditor();
    cy.GlobalSearchEntity(`${datasourceName}`);
    cy.get(`.t--entity-name:contains(${datasourceName})`)
      .last()
      .click();
    cy.generateUUID().then((uid) => {
      updatedName = uid;
      cy.log("complete uid :" + updatedName);
      updatedName = uid.replace(/-/g, "_").slice(1, 15);
      cy.log("sliced id :" + updatedName);
      cy.EditEntityNameByDoubleClick(datasourceName, updatedName);
      cy.SearchEntityandOpen(updatedName);
      cy.hoverAndClick();
      cy.get(apiwidget.delete).click({ force: true });
      //This is check to make sure if a datasource is active 409
      cy.wait("@deleteDatasource").should(
        "have.nested.property",
        "response.body.responseMeta.status",
        409,
      );
    });

    cy.SearchEntityandOpen("Query1");
    cy.deleteQuery();
  });
});
