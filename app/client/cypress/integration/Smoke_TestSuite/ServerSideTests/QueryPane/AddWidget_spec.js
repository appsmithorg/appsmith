const queryLocators = require("../../../../locators/QueryEditor.json");
const queryEditor = require("../../../../locators/QueryEditor.json");

let datasourceName;

describe("Add widget - Postgress DataSource", function() {
  beforeEach(() => {
    cy.startRoutesForDatasource();
    cy.createPostgresDatasource();
    cy.get("@createDatasource").then((httpResponse) => {
      datasourceName = httpResponse.response.body.data.name;
    });
  });

  it("1. Verify 'Add to widget [Widget Suggestion]' functionality - Postgress", () => {
    cy.NavigateToActiveDSQueryPane(datasourceName);
    cy.get(queryLocators.templateMenu).click();
    cy.get(".CodeMirror textarea")
      .first()
      .focus()
      .type("select * from configs");
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.WaitAutoSave();
    cy.runQuery();
    cy.get(queryEditor.suggestedTableWidget).click();
    //cy.SearchEntityandOpen("Table1");
    cy.selectEntityByName("WIDGETS");
    cy.actionContextMenuByEntityName("Table1");
    cy.isSelectRow(1);
    cy.readTabledataPublish("1", "0").then((tabData) => {
      const tabValue = tabData;
      expect(tabValue).to.be.equal("5");
      cy.log("the value is " + tabValue);
    });
  });
});
