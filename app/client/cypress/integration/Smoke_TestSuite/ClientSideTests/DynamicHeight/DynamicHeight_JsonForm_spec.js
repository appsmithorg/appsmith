const dsl = require("../../../../fixtures/jsonFormDynamicHeightDsl.json");
const commonlocators = require("../../../../locators/commonlocators.json");

describe("Dynamic Height Width validation", function() {
  it("Validate change with auto height width for JsonForm", function() {
    cy.addDsl(dsl);
    cy.wait(3000); //for dsl to settle
    cy.openPropertyPane("jsonformwidget");
    cy.get(".t--widget-jsonformwidget")
      .invoke("css", "height")
      .then((formheight) => {
        cy.changeLayoutHeight(commonlocators.autoHeight);
        cy.wait(5000);
        cy.get(".t--widget-jsonformwidget")
          .invoke("css", "height")
          .then((newformheight) => {
            expect(formheight).to.not.equal(newformheight);
            cy.get(".t--show-column-btn")
              .eq(0)
              .click({ force: true });
            cy.get(".t--show-column-btn")
              .eq(1)
              .click({ force: true });
            cy.get(".t--show-column-btn")
              .eq(2)
              .click({ force: true });
            // cy.get("[data-cy='t--resizable-handle-TOP']")
            //     .within(($el) => {
            //         cy.window().then((win) => {
            //             const after = win.getComputedStyle($el[0], "::after");
            //             expect(after).not.to.exist
            //         });
            //     });
            // cy.get("[data-cy='t--resizable-handle-BOTTOM']").should("not.exist");
            cy.changeLayoutHeight(commonlocators.fixed);
            cy.wait(5000);
            cy.get(".t--widget-jsonformwidget")
              .invoke("css", "height")
              .then((updatedformheight) => {
                expect(newformheight).to.not.equal(updatedformheight);
                cy.get(".t--show-column-btn")
                  .eq(2)
                  .click({ force: true });
                cy.get(".t--show-column-btn")
                  .eq(1)
                  .click({ force: true });
                // cy.get("[data-cy='t--resizable-handle-TOP']").should("exist");
                // cy.get("[data-cy='t--resizable-handle-BOTTOM']").should("exist");
                cy.changeLayoutHeight(commonlocators.autoHeight);
                cy.wait(5000);
                cy.get(".t--widget-jsonformwidget")
                  .invoke("css", "height")
                  .then((newupdatedformheight) => {
                    expect(updatedformheight).to.not.equal(
                      newupdatedformheight,
                    );
                  });
              });
          });
      });
  });
});
