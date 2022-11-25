const dsl = require("../../../../fixtures/dynamicHeightContainerCheckboxdsl.json");
const commonlocators = require("../../../../locators/commonlocators.json");

describe("Dynamic Height Width validation", function() {
  it("Validate change with auto height width for widgets", function() {
    cy.addDsl(dsl);
    cy.wait(3000); //for dsl to settle
    cy.openPropertyPane("containerwidget");
    //cy.changeLayoutHeight(commonlocators.autoHeight);
    cy.openPropertyPane("checkboxgroupwidget");
    //cy.changeLayoutHeight(commonlocators.autoHeight);
    cy.get(".t--widget-containerwidget")
      .invoke("css", "height")
      .then((height) => {
        cy.get(".t--widget-checkboxgroupwidget")
          .invoke("css", "height")
          .then((checkboxheight) => {
            cy.get(commonlocators.addOption).click();
            cy.wait("@updateLayout").should(
              "have.nested.property",
              "response.body.responseMeta.status",
              200,
            );
            cy.get(".t--widget-checkboxgroupwidget")
              .invoke("css", "height")
              .then((newcheckboxheight) => {
                expect(checkboxheight).to.not.equal(newcheckboxheight);
              });
          });
        cy.wait(2000);
        cy.get(".t--widget-containerwidget")
          .invoke("css", "height")
          .then((newheight) => {
            expect(height).to.not.equal(newheight);
          });
      });
  });
});
