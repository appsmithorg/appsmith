const queryLocators = require("../../../../locators/QueryEditor.json");
const queryEditor = require("../../../../locators/QueryEditor.json");
import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const autoLayout = ObjectsRegistry.AutoLayout;

let datasourceName;

describe("Add widget - Postgress DataSource", function () {
  beforeEach(() => {
    cy.startRoutesForDatasource();
    cy.createPostgresDatasource();
    cy.get("@saveDatasource").then((httpResponse) => {
      datasourceName = httpResponse.response.body.data.name;
    });
  });

  it("1. Validate Snipping with query and table widget on canvas", () => {
    cy.get(".t--close-editor span:contains('Back')").click({ force: true });
    cy.get(".t--back-button span:contains('Back')").click({ force: true });

    autoLayout.convertToAutoLayoutAndVerify(false);
    cy.NavigateToActiveDSQueryPane(datasourceName);
    cy.get(queryLocators.templateMenu).click();
    cy.wait(500);
    cy.get(".CodeMirror textarea")
      .first()
      .focus()
      .type("select * from public.configs");
    cy.WaitAutoSave();
    cy.runQuery();
    cy.get(queryEditor.suggestedTableWidget).click();
    cy.CheckAndUnfoldEntityItem("Widgets");
    cy.selectEntityByName("Table1");
    cy.isSelectRow(1);
    cy.readTableV2dataPublish("1", "0").then((tabData) => {
      cy.log("the value is " + tabData);
      expect(tabData).to.be.equal("5");
    });
  });
});
