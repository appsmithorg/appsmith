const commonlocators = require("../../../../locators/commonlocators.json");
const dsl = require("../../../../fixtures/invisibleWidgetdsl.json");

describe("Dynamic Height Width validation for Visibility", function () {
    before(() => {
        cy.addDsl(dsl);
    });
    it("Validating visbility/invisiblity of widget with dynamic height feature", function () {
        //changing the Text Name and verifying
        cy.wait(3000);
        cy.openPropertyPane("containerwidget");
        cy.changeLayoutHeightWithoutWait(commonlocators.autoHeight);
        cy.get(".t--widget-containerwidget").invoke("css", "height")
            .then((theight) => {
                cy.get(commonlocators.checkboxIndicator).click({ force: true })
                cy.get(".t--widget-containerwidget").invoke("css", "height")
                    .then((tnewheight) => {
                        expect(theight).to.equal(tnewheight);
                        //cy.get("label:Contains('OFF')").should("be.visible");
                        cy.get("label:Contains('On')").should("not.be.enabled")
                    });
            });
        cy.PublishtheApp();
        cy.get(".t--widget-containerwidget").invoke("css", "height")
            .then((theight) => {
                cy.get(".bp3-control-indicator").click({ force: true })
                cy.get(".t--widget-containerwidget").invoke("css", "height")
                    .then((tnewheight) => {
                        expect(theight).to.equal(tnewheight);
                        cy.get("label:Contains('On')").should("not.be.enabled")
                        //cy.get("label:Contains('Off')").should("be.visible");
                    });
            });
    });
});