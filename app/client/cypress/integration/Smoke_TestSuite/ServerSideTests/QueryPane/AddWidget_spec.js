const queryLocators = require("../../../../locators/QueryEditor.json");
const queryEditor = require("../../../../locators/QueryEditor.json");

let datasourceName;

describe("Add widget", function() {
  beforeEach(() => {
    cy.startRoutesForDatasource();
    cy.createPostgresDatasource();
    cy.get("@createDatasource").then((httpResponse) => {
      datasourceName = httpResponse.response.body.data.name;
    });
  });

  it("Add widget", () => {
    cy.NavigateToQueryEditor();
    cy.contains(".t--datasource-name", datasourceName)
      .find(queryLocators.createQuery)
      .click();

    cy.get(queryLocators.templateMenu).click();
    cy.get(".CodeMirror textarea")
      .first()
      .focus()
      .type("select * from configs");
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.WaitAutoSave();
    cy.get(queryEditor.runQuery).click();
    cy.wait("@postExecute").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.get(queryEditor.suggestedTableWidget).click();
    cy.SearchEntityandOpen("Table1");
    cy.isSelectRow(1);
    cy.readTabledataPublish("1", "0").then((tabData) => {
      const tabValue = tabData;
      expect(tabValue).to.be.equal("5");
      cy.log("the value is " + tabValue);
    });
  });
});
