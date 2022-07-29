const explorer = require("../../../../locators/explorerlocators.json");
const globalSearch = require("../../../../locators/GlobalSearch.json");
const queryLocators = require("../../../../locators/QueryEditor.json");
import { ObjectsRegistry } from "../../../../support/Objects/Registry";
let ee = ObjectsRegistry.EntityExplorer;

describe("Entity explorer context menu", function() {
  it("Entity explorer menu must close on scroll", function() {
    // Setup to make the explorer scrollable
    ee.ExpandCollapseEntity("DATASOURCES");
    ee.ExpandCollapseEntity("QUERIES/JS");
    ee.ExpandCollapseEntity("WIDGETS");
    cy.contains("DEPENDENCIES").click();
    cy.get(explorer.addDBQueryEntity).click();
    cy.contains("[data-cy='t--tab-MOCK_DATABASE']", "Sample Databases").click();
    cy.contains(".t--mock-datasource", "Users").click();
    cy.contains(".t--datasource", "Users").within(() => {
      cy.get(queryLocators.createQuery).click({ force: true });
    });
    ee.ExpandCollapseEntity("public.users");

    cy.get(globalSearch.createNew).click();
    cy.get(".t--entity-explorer-wrapper").scrollTo("top");
  });
});
