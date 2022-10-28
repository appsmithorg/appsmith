const dsl = require("../../../../fixtures/alignmentWithDynamicHeightDsl.json");
const commonlocators = require("../../../../locators/commonlocators.json");

describe("Dynamic Height Width validation", function () {
    it("Validate change with auto height width for text widgets", function () {
        cy.addDsl(dsl);
        cy.wait(30000); //for dsl to settled 
        cy.get("button:contains('Small')").click({ force: true });
        cy.openPropertyPaneWithIndex("textwidget", 0);
        cy.get(".t--widget-textwidget").invoke("css", "height")
            .then((firstText) => {
                cy.openPropertyPaneWithIndex("textwidget", 1);
                cy.get(".t--widget-textwidget").invoke("css", "height")
                    .then((secondText) => {
                        cy.selectEntityByName("Text3");
                        cy.get(".t--widget-textwidget").invoke("css", "height")
                        .then((thirdText) => {
                            cy.selectEntityByName("Text4");
                            cy.get(".t--widget-textwidget").invoke("css", "height")
                                    .then((fourthText) => {
                                        cy.get("button:contains('Large')").click({ force: true });
                                        cy.selectEntityByName("Text1");
                                        cy.get(".t--widget-textwidget").invoke("css", "height")
                                            .then((largefirstText) => {
                                                cy.selectEntityByName("Text2");
                                                cy.get(".t--widget-textwidget").invoke("css", "height")
                                                    .then((largesecondText) => {
                                                        cy.selectEntityByName("Text3");
                                                        cy.get(".t--widget-textwidget").invoke("css", "height")
                                                            .then((largethirdText) => {
                                                                cy.selectEntityByName("Text4");
                                                                cy.get(".t--widget-textwidget").invoke("css", "height")
                                                                    .then((largefourthText) => {
                                                                        expect(firstText).to.not.equal(largefirstText);
                                                                        expect(secondText).to.not.equal(largesecondText);
                                                                        expect(thirdText).to.not.equal(largethirdText);
                                                                        expect(fourthText).to.not.equal(largefourthText);
                                                                    })
                                                            })
                                                    })
                                            })

                                    });
                            });
                    })
            })
    })
})