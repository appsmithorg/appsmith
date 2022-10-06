const dsl = require("../../../../fixtures/debuggerTableDsl.json");
const explorer = require("../../../../locators/explorerlocators.json");
const testdata = require("../../../../fixtures/testdata.json");
import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const debuggerHelper = ObjectsRegistry.DebuggerHelper;

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
    // Wait for the debugger icon to be visible
    cy.get(".t--debugger").should("be.visible");
    // debuggerHelper.isErrorCount(0);
    cy.wait("@postExecute");
    debuggerHelper.AssertErrorCount(1);
  });
});
