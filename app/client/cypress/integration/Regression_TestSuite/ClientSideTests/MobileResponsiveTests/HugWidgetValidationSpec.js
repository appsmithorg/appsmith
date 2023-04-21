const dsl = require("../../../../fixtures/ImageHugWidgetDsl.json");
const commonlocators = require("../../../../locators/commonlocators.json");

describe("Validating Mobile Views with Hug Widgets", function () {
  it("Validate change with height width for widgets for hug widgets", function () {
    cy.get(commonlocators.autoConvert).click({
      force: true,
    });
    cy.get(commonlocators.convert).click({
      force: true,
    });
    cy.get(commonlocators.refreshApp).click({
      force: true,
    });
    cy.wait(4000);
    cy.get("canvas").should("be.visible");
    cy.addDsl(dsl);
    cy.wait(5000); //for dsl to settle
    cy.get(".t--widget-imagewidget").first().should("be.visible");
    cy.PublishtheApp();
    cy.wait(2000);
    cy.get(".t--widget-imagewidget").first().should("be.visible");
  });
  //[390,844]: latest iphone14 viewport
  //[360,780]: latest samsung galaxy s22 tablet viewport
  let phones = ["iphone-4", "samsung-s10", [390, 844], [360, 780]];
  phones.forEach((phone) => {
    it(`${phone} port execution`, function () {
      if (Cypress._.isArray(phone)) {
        cy.viewport(phone[0], phone[1]);
      } else {
        cy.viewport(phone);
      }
      cy.wait(2000); //for view to settle
      cy.get(".t--widget-imagewidget").first().should("be.visible");
      cy.get(".t--widget-imagewidget")
        .first()
        .invoke("css", "width")
        .then((width) => {
          expect(parseFloat(width)).to.greaterThan(parseFloat("250px"));
        });
    });
  });
});
