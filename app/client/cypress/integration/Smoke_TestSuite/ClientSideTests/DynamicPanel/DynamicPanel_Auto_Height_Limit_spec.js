const dsl = require("../../../../fixtures/dynamicHeightContainer.json");
const commonlocators = require("../../../../locators/commonlocators.json");
const cdsl = require("../../../../fixtures/multipleContainerdsl.json");
const tdsl = require("../../../../fixtures/textWidgetDynamicdsl.json");
const invidsl = require("../../../../fixtures/invisbleWidgetdsl.json");
const tabdsl = require("../../../../fixtures/dynamicTabWidgetdsl.json");
describe("Dynamic Height Width validation with limits", function () {
   
    it("Validate change in auto height with limits width for widgets", function () {
        cy.addDsl(dsl);
        cy.wait(3000); //for dsl to settle
        cy.openPropertyPane("containerwidget");
        cy.changeLayoutHeight(commonlocators.autoHeightWithLimits);
        cy.wait(3000); //for dsl to settle
        //cy.checkDefaultValue("minheight\\(inrows\\)","4")
        cy.contains("4");
        cy.testJsontext("minheight\\(inrows\\)", "5");
        //cy.checkDefaultValue("minheight\\(inrows\\)","49")
        cy.contains("40");
        cy.testJsontext("maxheight\\(inrows\\)", "60");
        cy.changeLayoutHeight(commonlocators.fixed);
        cy.changeLayoutHeight(commonlocators.autoHeightWithLimits);
        cy.contains("4");
        cy.contains("40");
    });
});