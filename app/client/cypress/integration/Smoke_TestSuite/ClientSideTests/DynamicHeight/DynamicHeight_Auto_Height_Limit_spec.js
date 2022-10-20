const dsl = require("../../../../fixtures/dynamicHeightContainerdsl.json");
const commonlocators = require("../../../../locators/commonlocators.json");

describe("Dynamic Height Width validation with limits", function () {
    it("Validate change in auto height with limits width for widgets and highlight section validation", function () {
        cy.addDsl(dsl);
        cy.wait(3000); //for dsl to settle
        cy.openPropertyPane("containerwidget");
        cy.changeLayoutHeight(commonlocators.autoHeightWithLimits);
        cy.wait(3000); //for dsl to settle
        cy.contains("4");
        cy.checkDefaultValue(commonlocators.minHeight, 0, "4")
        cy.testJsontext(commonlocators.minHeight, "5");
        cy.get(commonlocators.overlayMin).should("be.visible");
        cy.get(commonlocators.overlayMin).should(
            "have.css",
            "background-color",
            "rgba(243, 43, 139, 0.1)",
        );
        cy.contains("Min-height: 5 rows");
        cy.contains("40");
        cy.checkDefaultValue(commonlocators.maxHeight, 1, "40")
        cy.testJsontext(commonlocators.maxHeight, "60");
        cy.get(commonlocators.overlayMax).should("be.visible");
        cy.get(commonlocators.overlayMax).should(
            "have.css",
            "background-color",
            "rgba(243, 43, 139, 0.1)",
        );
        cy.contains("Max-height: 60 rows");
        cy.changeLayoutHeight(commonlocators.fixed);
        cy.changeLayoutHeight(commonlocators.autoHeightWithLimits);
        cy.checkDefaultValue(commonlocators.minHeight, 0, "5")
        cy.checkDefaultValue(commonlocators.maxHeight, 1, "60")
    });
});