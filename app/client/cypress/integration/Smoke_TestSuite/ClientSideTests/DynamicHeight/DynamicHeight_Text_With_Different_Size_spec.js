const dsl = require("../../../../fixtures/alignmentWithDynamicHeightDsl.json");
const commonlocators = require("../../../../locators/commonlocators.json");

describe("Dynamic Height Width validation", function() {
  function validateCssProperties(property) {
    cy.get("button:contains('Small')").click({ force: true });
    cy.wait(3000);
    cy.selectEntityByName("Text1");
    cy.get(".t--widget-textwidget")
      .eq(0)
      .invoke("css", property)
      .then((firstText) => {
        cy.selectEntityByName("Text2");
        cy.get(".t--widget-textwidget")
          .eq(1)
          .invoke("css", property)
          .then((secondText) => {
            cy.selectEntityByName("Text3");
            cy.get(".t--widget-textwidget")
              .eq(2)
              .invoke("css", property)
              .then((thirdText) => {
                cy.selectEntityByName("Text4");
                cy.get(".t--widget-textwidget")
                  .eq(3)
                  .invoke("css", property)
                  .then((fourthText) => {
                    cy.get("button:contains('Large')").click({ force: true });
                    cy.selectEntityByName("Text1");
                    cy.get(".t--widget-textwidget")
                      .eq(0)
                      .invoke("css", property)
                      .then((largefirstText) => {
                        cy.selectEntityByName("Text2");
                        cy.get(".t--widget-textwidget")
                          .eq(1)
                          .invoke("css", property)
                          .then((largesecondText) => {
                            cy.selectEntityByName("Text3");
                            cy.get(".t--widget-textwidget")
                              .eq(2)
                              .invoke("css", property)
                              .then((largethirdText) => {
                                cy.selectEntityByName("Text4");
                                cy.get(".t--widget-textwidget")
                                  .eq(3)
                                  .invoke("css", property)
                                  .then((largefourthText) => {
                                    if (property == "left") {
                                      expect(firstText).to.equal(
                                        largefirstText,
                                      );
                                      expect(secondText).to.equal(
                                        largesecondText,
                                      );
                                      expect(thirdText).to.equal(
                                        largethirdText,
                                      );
                                      expect(fourthText).to.equal(
                                        largefourthText,
                                      );
                                    } else {
                                      expect(firstText).to.not.equal(
                                        largefirstText,
                                      );
                                      expect(secondText).to.not.equal(
                                        largesecondText,
                                      );
                                      expect(thirdText).to.not.equal(
                                        largethirdText,
                                      );
                                      expect(fourthText).to.not.equal(
                                        largefourthText,
                                      );
                                    }
                                    cy.get("button:contains('Small')").click({
                                      force: true,
                                    });
                                    cy.wait(3000);
                                    cy.selectEntityByName("Text1");
                                    cy.get(".t--widget-textwidget")
                                      .eq(0)
                                      .invoke("css", property)
                                      .then((updatelargefirstText) => {
                                        cy.selectEntityByName("Text2");
                                        cy.get(".t--widget-textwidget")
                                          .eq(1)
                                          .invoke("css", property)
                                          .then((updatelargesecondText) => {
                                            cy.selectEntityByName("Text3");
                                            cy.get(".t--widget-textwidget")
                                              .eq(2)
                                              .invoke("css", property)
                                              .then((updatelargethirdText) => {
                                                cy.selectEntityByName("Text4");
                                                cy.get(".t--widget-textwidget")
                                                  .eq(3)
                                                  .invoke("css", property)
                                                  .then(
                                                    (updatelargefourthText) => {
                                                      //expect(firstText).to.equal(updatelargefirstText);
                                                      expect(
                                                        secondText,
                                                      ).to.equal(
                                                        updatelargesecondText,
                                                      );
                                                      expect(
                                                        thirdText,
                                                      ).to.equal(
                                                        updatelargethirdText,
                                                      );
                                                      expect(
                                                        fourthText,
                                                      ).to.equal(
                                                        updatelargefourthText,
                                                      );
                                                    },
                                                  );
                                              });
                                          });
                                      });
                                  });
                              });
                          });
                      });
                  });
              });
          });
      });
  }
  it("Validate change with auto height width for text widgets", function() {
    cy.addDsl(dsl);
    cy.wait(30000); //for dsl to settled
    validateCssProperties("height");
    //validateCssProperties("top");
    validateCssProperties("left");
  });
});
