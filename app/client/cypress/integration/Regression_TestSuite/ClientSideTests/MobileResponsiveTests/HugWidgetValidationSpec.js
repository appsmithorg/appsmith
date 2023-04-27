const dsl = require("../../../../fixtures/ImageHugWidgetDsl.json");
const commonlocators = require("../../../../locators/commonlocators.json");

describe("Validating Mobile Views", function () {
  it("1. Validate change with height width for widgets", function () {
    cy.get(commonlocators.autoConvert).click({
      force: true,
    });
    cy.wait(2000);
    cy.get(commonlocators.convert).click({
      force: true,
    });
    cy.wait(2000);
    cy.get(commonlocators.refreshApp).click({
      force: true,
    });
    cy.wait(2000);
    cy.addDsl(dsl);
    cy.wait(5000); //for dsl to settle
    cy.PublishtheApp();
    cy.wait(2000);
    cy.get(".t--widget-imagewidget").first().should("be.visible");
  });
  //Added viewports of iphone14 and samsung galaxy s22 for testing purpose
  let phones = ["iphone-4", "samsung-s10", [390, 844], [360, 780]];
  phones.forEach((phone, index) => {
    it(`${index + 1}. ${phone} port execution`, function () {
      if (Cypress._.isArray(phone)) {
        cy.viewport(phone[0], phone[1]);
      } else {
        cy.viewport(phone);
      }
      cy.wait(2000);
      cy.get(".t--widget-imagewidget")
        .first()
        .invoke("css", "width")
        .then((width) => {
          expect(parseFloat(width)).to.greaterThan(parseFloat("250px"));
        });
    });
  });
});
