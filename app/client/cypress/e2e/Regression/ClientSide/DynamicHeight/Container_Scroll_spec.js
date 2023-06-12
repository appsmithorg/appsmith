const dsl = require("../../../../fixtures/dynamicHeightContainerScrolldsl.json");
import { entityExplorer } from "../../../../support/Objects/ObjectsCore";

describe("Dynamic Height Width validation", function () {
  it("1. Validate change with auto height width for widgets", function () {
    cy.addDsl(dsl);
    cy.wait(3000); //for dsl to settle
    entityExplorer.SelectEntityByName("Container1");
    cy.get(".t--widget-textwidget").trigger("mouseover", { force: true }); // Scroll 'sidebar' to its bottom
    entityExplorer.SelectEntityByName("Text1", "Container1");
    //cy.PublishtheApp();
    //cy.wait(5000);
    //cy.get(".t--widget-containerwidget").trigger("mouseover",{force:true}) // Scroll 'sidebar' to its bottom
    cy.wait(5000);
  });
});
