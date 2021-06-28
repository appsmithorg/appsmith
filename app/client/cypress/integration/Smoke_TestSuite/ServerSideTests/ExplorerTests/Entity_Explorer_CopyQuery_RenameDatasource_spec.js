const queryLocators = require("../../../../locators/QueryEditor.json");
const datasource = require("../../../../locators/DatasourcesEditor.json");
const apiwidget = require("../../../../locators/apiWidgetslocator.json");
const commonlocators = require("../../../../locators/commonlocators.json");
const explorer = require("../../../../locators/explorerlocators.json");

const pageid = "MyPage";
let updatedName;
let datasourceName;
let newDsName;

describe("Entity explorer tests related to copy query", function() {
  beforeEach(() => {
    cy.startRoutesForDatasource();
  });

  it("Create a query with dataSource in explorer", function() {
    cy.NavigateToDatasourceEditor();
    cy.get(datasource.PostgreSQL).click();

    cy.getPluginFormsAndCreateDatasource();

    cy.fillPostgresDatasourceForm();

    cy.testDatasource();

    cy.get(".t--save-datasource").click();

    cy.wait("@saveDatasource").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.get("@saveDatasource").then((httpResponse) => {
      datasourceName = httpResponse.response.body.data.name;
      newDsName = datasourceName;
      cy.log(datasourceName);
      cy.NavigateToQueryEditor();
      cy.get(".t--datasource-name:contains(".concat(datasourceName).concat(")"))
        .find(queryLocators.createQuery)
        .click({ force: true });
    });

    cy.get("@getPluginForm").should("not.be.null");
    cy.get(queryLocators.templateMenu).click();
    cy.get(".CodeMirror textarea")
      .first()
      .focus()
      .type("select * from users");

    cy.EvaluateCurrentValue("select * from users");

    cy.get("@createDatasource").then((httpResponse) => {
      datasourceName = httpResponse.response.body.data.name;

      cy.get(`.t--entity.action:contains(Query1)`)
        .find(explorer.collapse)
        .click();
      cy.get(apiwidget.propertyList).then(function($lis) {
        expect($lis).to.have.length(4);
        expect($lis.eq(0)).to.contain("{{Query1.isLoading}}");
        expect($lis.eq(1)).to.contain("{{Query1.data}}");
        expect($lis.eq(2)).to.contain("{{Query1.responseMeta}}");
        expect($lis.eq(3)).to.contain("{{Query1.run()}}");
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
    });
  });

  it("Delete query and rename datasource in explorer", function() {
    cy.get(commonlocators.entityExplorersearch).clear({ force: true });
    cy.NavigateToDatasourceEditor();
    cy.GlobalSearchEntity(`${newDsName}`);
    cy.get(`.t--entity-name:contains(${newDsName})`)
      .last()
      .click();
    cy.generateUUID().then((uid) => {
      updatedName = uid;
      cy.log("complete uid :" + updatedName);
      updatedName = uid.replace(/-/g, "_").slice(1, 15);
      cy.log("sliced id :" + updatedName);
      cy.EditEntityNameByDoubleClick(newDsName, updatedName);
      cy.SearchEntityandOpen(updatedName);
      cy.get(".t--edit-datasource").click({ force: true });
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
    cy.SearchEntityandOpen("Query1");
    cy.hoverAndClick();
    cy.get(apiwidget.delete).click({ force: true });
    cy.wait(500);
    cy.get(
      commonlocators.entitySearchResult.concat("Query1").concat("')"),
    ).should("have.length", 1);
  });
});
