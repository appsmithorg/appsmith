const queryLocators = require("../../../../locators/QueryEditor.json");
const queryEditor = require("../../../../locators/QueryEditor.json");
import { seconds, testTimeout } from "../../../../support/timeout";

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
    testTimeout(seconds(5))
    cy.NavigateToActiveDSQueryPane(datasourceName);
    cy.get(queryLocators.templateMenu).click();
    cy.get(".CodeMirror textarea")
      .first()
      .focus()
      .type("select * from configs");
    cy.WaitAutoSave();
    cy.runQuery();
    cy.get(queryEditor.suggestedTableWidget).click();
    //cy.SearchEntityandOpen("Table1");
    cy.CheckAndUnfoldEntityItem("WIDGETS");
    cy.selectEntityByName("Table1");
    cy.isSelectRow(1);
    cy.readTableV2dataPublish("1", "0").then((tabData) => {
      cy.log("the value is " + tabData);
      expect(tabData).to.be.equal("5");
    });
  });
});
