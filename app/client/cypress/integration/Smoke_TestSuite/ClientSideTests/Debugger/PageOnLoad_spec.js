const dsl = require("../../../../fixtures/debuggerTableDsl.json");
const explorer = require("../../../../locators/explorerlocators.json");
const debuggerLocators = require("../../../../locators/Debugger.json");
const testdata = require("../../../../fixtures/testdata.json");

describe("Check debugger logs state when there are onPageLoad actions", function() {
  before(() => {
    cy.addDsl(dsl);
  });
  it("Check debugger logs state when there are onPageLoad actions", function() {
    cy.openPropertyPane("tablewidget");
    cy.testJsontext("tabledata", "{{TestApi.data.users}}");
    cy.NavigateToAPI_Panel();
    cy.CreateAPI("TestApi");
    cy.enterDatasourceAndPath(testdata.baseUrl, testdata.methods);
    cy.SaveAndRunAPI();

    cy.get(explorer.addWidget).click();

    cy.reload();
    cy.get(".t--debugger-count").should("not.be.visible");
  });
});
