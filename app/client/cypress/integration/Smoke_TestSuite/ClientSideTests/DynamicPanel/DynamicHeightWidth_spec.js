const commonlocators = require("../../../../locators/commonlocators.json");
const dsl = require("../../../../fixtures/invisbleWidgetdsl.json");

describe("Dynamic Height Width validation for Invisiblity", function () {
    before(() => {
        cy.addDsl(invidsl);
    });
    it("Validating visbility/invisiblity of widget with dynamic height feature", function () {
        //changing the Text Name and verifying
        cy.wait(3000);
        cy.openPropertyPane("containerwidget");
        cy.changeLayoutHeightWithoutWait(commonlocators.autoHeight);
        cy.get(".t--widget-containerwidget").invoke("css", "height")
            .then((theight) => {
                cy.get(".t--draggable-checkboxwidget .bp3-control-indicator").click({ force: true })
                cy.get(".t--widget-containerwidget").invoke("css", "height")
                    .then((tnewheight) => {
                        expect(theight).to.equal(tnewheight);
                        //cy.get("label:Contains('OFF')").should("be.visible");
                        cy.get("label:Contains('ON')").should("not.be.enabled")
                    });
            });
        cy.PublishtheApp();
        cy.get(".t--widget-containerwidget").invoke("css", "height")
            .then((theight) => {
                cy.get(".bp3-control-indicator").click({ force: true })
                cy.get(".t--widget-containerwidget").invoke("css", "height")
                    .then((tnewheight) => {
                        expect(theight).to.equal(tnewheight);
                        cy.get("label:Contains('ON')").should("not.be.enabled")
                        //cy.get("label:Contains('Off')").should("be.visible");
                    });
            });
    });
});
