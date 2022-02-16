const queryLocators = require("../../../../locators/QueryEditor.json");
const queryEditor = require("../../../../locators/QueryEditor.json");
const dsl = require("../../../../fixtures/inputdsl.json");
const widgetsPage = require("../../../../locators/Widgets.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const testdata = require("../../../../fixtures/testdata.json");

let datasourceName;

describe("Addwidget from Query and bind with other widgets", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  beforeEach(() => {
    cy.startRoutesForDatasource();
  });

  it("1. Create a PostgresDataSource", () => {
    cy.createPostgresDatasource();
    cy.get("@createDatasource").then((httpResponse) => {
      datasourceName = httpResponse.response.body.data.name;
    });
  });

  it("2. Create a query and populate response by choosing addWidget and validate in Table Widget", () => {
    cy.NavigateToActiveDSQueryPane(datasourceName);
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

    cy.onlyQueryRun();
    cy.xpath(queryEditor.queryResponse)
      .first()
      .invoke("text")
      .then((text) => {
        const tableRowTxt = text;
        cy.get(queryEditor.suggestedTableWidget).click();
        cy.SearchEntityandOpen("Table1");
        cy.isSelectRow(1);
        cy.readTabledataPublish("1", "0").then((tabData) => {
          const tabValue = tabData;
          cy.log("the value is" + tabValue);
          expect(tabValue).to.be.equal("5");
          expect(tableRowTxt).to.equal(tabValue);
        });
      });
  });

  it("3. Input widget test with default value from table widget", () => {
    cy.get(".t--entity-name")
      .contains("WIDGETS")
      .click();
    cy.SearchEntityandOpen("Input1");
    cy.get(widgetsPage.defaultInput).type(testdata.addInputWidgetBinding);
    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
  });

  it("4. validation of data displayed in input widget based on row data selected", function() {
    cy.isSelectRow(1);
    cy.readTabledataPublish("1", "0").then((tabData) => {
      const tabValue = tabData;
      cy.log("the value is" + tabValue);
      expect(tabValue).to.be.equal("5");
      cy.isSelectRow(1);
      cy.get(publish.inputWidget + " " + "input")
        .first()
        .invoke("attr", "value")
        .should("contain", tabValue);
    });
  });
});
