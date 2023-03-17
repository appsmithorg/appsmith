const dsl = require("../../../../fixtures/dynamicHeightContainerdsl.json");
const commonlocators = require("../../../../locators/commonlocators.json");

describe("Dynamic Height Width validation with limits", function() {
  it("Validate change in auto height with limits width for widgets and highlight section validation", function() {
    cy.addDsl(dsl);
    cy.wait(3000); //for dsl to settle
    cy.openPropertyPane("containerwidget");
    cy.get(commonlocators.generalSectionHeight).should("be.visible");
    cy.changeLayoutHeight(commonlocators.autoHeightWithLimits);
    cy.wait(3000); //for dsl to settle
    //cy.checkMinDefaultValue(commonlocators.minHeight,"4")
    //cy.testJsontext(commonlocators.minHeight, "5");
    //cy.get(commonlocators.overlayMin).should("be.visible");
    cy.get("[data-cy='t--auto-height-overlay-handles-min']").trigger(
      "mouseover",
    );
    cy.contains("Min-Height: 10 rows");
    cy.get("[data-cy='t--auto-height-overlay-handles-min']").should(
      "be.visible",
    );
    cy.get("[data-cy='t--auto-height-overlay-handles-min'] div")
      .eq(0)
      .should("have.css", "background-color", "rgb(243, 43, 139)");
    /*cy.get(commonlocators.overlayMin).should(
            "have.css",
            "background-color",
            "rgba(243, 43, 139, 0.1)",
        );*/
    cy.get("[data-cy='t--auto-height-overlay-handles-max']").trigger(
      "mouseover",
    );
    cy.contains("Max-Height: 12 rows");
    //cy.checkMaxDefaultValue(commonlocators.maxHeight,"40")
    //cy.testJsontext(commonlocators.maxHeight, "60");
    cy.get("[data-cy='t--auto-height-overlay-handles-max']").should(
      "be.visible",
    );
    cy.get("[data-cy='t--auto-height-overlay-handles-max'] div")
      .eq(0)
      .should("have.css", "background-color", "rgb(243, 43, 139)");
    //cy.contains("Max-Height: 60 rows");
    cy.changeLayoutHeight(commonlocators.fixed);
    cy.changeLayoutHeight(commonlocators.autoHeightWithLimits);
    //cy.contains("Min-Height: 5 rows");
    //cy.checkMinDefaultValue(commonlocators.minHeight,"5")
    // cy.checkMaxDefaultValue(commonlocators.maxHeight,"60")
  });
});
