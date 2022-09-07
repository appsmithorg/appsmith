const explorer = require("../../../../locators/explorerlocators.json");
import { ObjectsRegistry } from "../../../../support/Objects/Registry";
let ee = ObjectsRegistry.EntityExplorer;

const shortName = "shortName";
const longName = "AVeryLongNameThatOverflows";
const alternateName = "AlternateName";

describe("Entity Explorer showing tooltips on long names", function() {
  it("Expect tooltip on long names only", function() {
    // create an API with a short name
    cy.NavigateToAPI_Panel();
    cy.CreateAPI(shortName);
    ee.ExpandCollapseEntity("QUERIES/JS", true);
    // assert that a tooltip does not show up during hover
    cy.get(`.t--entity-item:contains(${shortName})`).realHover();
    cy.get(".bp3-tooltip > .bp3-popover-content").should("not.exist");
    // reset the hover
    cy.get("body").realHover({ position: "topLeft" });

    // create another API with a long name
    cy.NavigateToAPI_Panel();
    cy.CreateAPI(longName);

    // assert that a tooltip does show up during hover
    cy.get(`.t--entity-item:contains(${longName})`).realHover();
    cy.get(".bp3-tooltip > .bp3-popover-content").should("have.text", longName);
    // reset the hover
    cy.get("body").realHover({ position: "topLeft" });

    // rename it and ensure the tooltip does not show again
    cy.get(`.t--entity-item:contains(${longName})`).within(() => {
      cy.get(".t--context-menu").click({ force: true });
    });
    cy.selectAction("Edit Name");
    cy.get(explorer.editEntity)
      .last()
      .type(alternateName, { force: true })
      .blur();
    cy.wait("@saveAction");

    cy.get(`.t--entity-item:contains(${alternateName})`).realHover();
    cy.get(".bp3-tooltip > .bp3-popover-content").should("not.exist");
  });
});
