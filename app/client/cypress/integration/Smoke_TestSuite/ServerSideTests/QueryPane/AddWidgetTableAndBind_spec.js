const queryLocators = require("../../../../locators/QueryEditor.json");
const queryEditor = require("../../../../locators/QueryEditor.json");
const dsl = require("../../../../fixtures/inputdsl.json");
const pages = require("../../../../locators/Pages.json");
const widgetsPage = require("../../../../locators/Widgets.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const testdata = require("../../../../fixtures/testdata.json");
const commonlocators = require("../../../../locators/commonlocators.json");

let datasourceName;

describe("Addwidget from Query and bind with other widgets", function() {
  before(() => {
    cy.addDsl(dsl);
  });
  it("Create a PostgresDataSource", () => {
    cy.createPostgresDatasource();
    cy.get("@createDatasource").then((httpResponse) => {
      datasourceName = httpResponse.response.body.data.name;
    });
  });
  it("Create a query and populate response by choosing addWidget and validate in Table Widget", () => {
    cy.NavigateToQueryEditor();
    cy.contains(".t--datasource-name", datasourceName)
      .find(queryLocators.createQuery)
      .click();
    cy.get(queryLocators.templateMenu).click();
    cy.get(".CodeMirror textarea")
      .first()
      .focus()
      .type("SELECT * FROM configs LIMIT 10;");
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(500);
    cy.get(queryEditor.runQuery).click();
    cy.wait("@postExecute").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.get(".t--add-widget").click();
    cy.SearchEntityandOpen("Table1");
    cy.isSelectRow(1);
    cy.readTabledataPublish("1", "0").then((tabData) => {
      const tabValue = tabData;
      cy.log("the value is" + tabValue);
      expect(tabValue).to.be.equal("5");
    });
  });
  it("Input widget test with default value from table widget", () => {
    cy.SearchEntityandOpen("Input1");
    cy.get(widgetsPage.defaultInput).type(testdata.addInputWidgetBinding);
    cy.get(commonlocators.editPropCrossButton).click({ force: true });
    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
  });
  it("validation of data displayed in input widget based on row data selected", function() {
    cy.isSelectRow(1);
    cy.readTabledataPublish("1", "0").then((tabData) => {
      const tabValue = tabData;
      cy.log("the value is" + tabValue);
      expect(tabValue).to.be.equal("5");
      cy.get(publish.inputWidget + " " + "input")
        .first()
        .invoke("attr", "value")
        .should("contain", tabValue);
    });
  });
});
