const dsl = require("../../../../fixtures/dynamicHeightContainerScrolldsl.json");
const commonlocators = require("../../../../locators/commonlocators.json");

describe("Dynamic Height Width validation", function() {
  it("Validate change with auto height width for widgets", function() {
    cy.addDsl(dsl);
    cy.wait(3000); //for dsl to settle
    cy.openPropertyPane("containerwidget");
    cy.get(".t--widget-textwidget").trigger("mouseover", { force: true }); // Scroll 'sidebar' to its bottom
    cy.openPropertyPane("textwidget");
    //cy.PublishtheApp();
    //cy.wait(5000);
    //cy.get(".t--widget-containerwidget").trigger("mouseover",{force:true}) // Scroll 'sidebar' to its bottom
    cy.wait(5000);
  });
});
