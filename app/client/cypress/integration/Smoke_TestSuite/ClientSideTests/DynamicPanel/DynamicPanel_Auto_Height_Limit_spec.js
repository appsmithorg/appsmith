const dsl = require("../../../../fixtures/dynamicHeightContainer.json");
const commonlocators = require("../../../../locators/commonlocators.json");
const cdsl = require("../../../../fixtures/multipleContainerdsl.json");
const tdsl = require("../../../../fixtures/textWidgetDynamicdsl.json");
const invidsl = require("../../../../fixtures/invisbleWidgetdsl.json");
const tabdsl = require("../../../../fixtures/dynamicTabWidgetdsl.json");
describe("Dynamic Height Width validation with limits", function () {

    it("Validate change in auto height with limits width for widgets and highlight section validation", function () {
        cy.addDsl(dsl);
        cy.wait(3000); //for dsl to settle
        cy.openPropertyPane("containerwidget");
        cy.changeLayoutHeight(commonlocators.autoHeightWithLimits);
        cy.wait(3000); //for dsl to settle
        cy.contains("4");
        cy.checkDefaultValue("minheight\\(inrows\\)",0,"4")
        cy.testJsontext("minheight\\(inrows\\)", "5");
        cy.get("[data-cy='t--auto-height-overlay-min']").should("be.visible");
        cy.get("[data-cy='t--auto-height-overlay-min']").should(
            "have.css",
            "background-color",
            "rgba(243, 43, 139, 0.1)",
        );
        cy.contains("Min-height: 5 rows");
        cy.contains("40");
        cy.checkDefaultValue("maxheight\\(inrows\\)",1,"40")
        cy.testJsontext("maxheight\\(inrows\\)", "60");
        cy.get("[data-cy='t--auto-height-overlay-max']").should("be.visible");
        cy.get("[data-cy='t--auto-height-overlay-max']").should(
            "have.css",
            "background-color",
            "rgba(243, 43, 139, 0.1)",
        );
        cy.contains("Max-height: 60 rows");
        cy.changeLayoutHeight(commonlocators.fixed);
        cy.changeLayoutHeight(commonlocators.autoHeightWithLimits);
        cy.checkDefaultValue("minheight\\(inrows\\)",0,"4")
        cy.checkDefaultValue("maxheight\\(inrows\\)",1,"40")
    });
});