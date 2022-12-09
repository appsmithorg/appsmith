const dsl = require("../../../../fixtures/DynamicHeightDefaultHeightdsl.json");
const commonlocators = require("../../../../locators/commonlocators.json");

describe("Dynamic Height Width validation", function() {
  it("Validate change with auto height width for widgets", function() {
    const modifierKey = Cypress.platform === "darwin" ? "meta" : "ctrl";
    cy.addDsl(dsl);
    cy.wait(3000); //for dsl to settle
    cy.openPropertyPane("containerwidget");
    cy.get(".t--widget-containerwidget")
      .invoke("css", "height")
      .then((height) => {
        cy.openPropertyPane("buttonwidget");
        cy.get("body").type("{del}", { force: true });
        cy.wait(2000);
        cy.get(".t--widget-containerwidget")
          .invoke("css", "height")
          .then((newheight) => {
            expect(height).to.not.equal(newheight);
            expect(newheight).to.equal("100px");
            cy.get("body").type(`{${modifierKey}}z`);
            cy.wait(2000);
            cy.get(".t--widget-containerwidget")
              .invoke("css", "height")
              .then((oheight) => {
                expect(oheight).to.equal(height);
                expect(oheight).to.not.equal(newheight);
              });
          });
      });
  });
});
