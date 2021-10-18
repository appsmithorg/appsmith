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

  beforeEach(() => {
    cy.startRoutesForDatasource();
  });
  it("Create a query and populate response by choosing addWidget and validate in Table Widget", () => {
    cy.createPostgresDatasource();
    cy.get("@createDatasource").then((httpResponse) => {
      datasourceName = httpResponse.response.body.data.name;
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
      // Mock the response for this test
      cy.intercept("/api/v1/actions/execute", {
        fixture: "addWidgetTable-mock",
      });
      cy.get(queryEditor.runQuery).click();
      cy.wait("@postExecute").should(
        "have.nested.property",
        "response.body.responseMeta.status",
        200,
      );
      cy.get(queryEditor.suggestedTableWidget).click();
      cy.createJSObject("return Query1.data;");

      cy.SearchEntityandOpen("Table1");
      cy.testJsontext("tabledata", "{{JSObject1.run()}}");
      cy.isSelectRow(1);
      cy.readTabledataPublish("1", "0").then((tabData) => {
        const tabValue = tabData;
        cy.log("the value is" + tabValue);
        expect(tabValue).to.be.equal("5");
      });
    });
  });
});
