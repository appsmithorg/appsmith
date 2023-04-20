const dsl = require("../../../../fixtures/inputWidgetMobileDsl.json");
const commonlocators = require("../../../../locators/commonlocators.json");
let theight;
let twidth;

describe("Validating Mobile Views with Fill Widgets", function () {
  it("Validate change with height width for Fill widgets", function () {
    cy.get(commonlocators.autoConvert).should("be.visible").click({
      force: true,
    });
    cy.get(commonlocators.convert).should("be.visible").click({
      force: true,
    });
    cy.get(commonlocators.refreshApp).should("be.visible").click({
      force: true,
    });
    cy.wait(2000);
    cy.get("canvas").should("be.visible");
    cy.addDsl(dsl);
    cy.get(".t--widget-inputwidgetv2").first().should("be.visible");
    cy.PublishtheApp();
    cy.wait(2000);
    cy.get(".t--widget-inputwidgetv2")
      .invoke("css", "height")
      .then((newheight) => {
        theight = newheight;
      });
    cy.get(".t--widget-inputwidgetv2")
      .invoke("css", "width")
      .then((newwidth) => {
        twidth = newwidth;
      });
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
      cy.get(".t--widget-inputwidgetv2").first().should("be.visible");
      cy.get(".t--widget-inputwidgetv2")
        .invoke("css", "height")
        .then((newheight) => {
          expect(theight).to.equal(newheight);
        });
      cy.get(".t--widget-inputwidgetv2")
        .invoke("css", "width")
        .then((newwidth) => {
          expect(twidth).to.not.equal(newwidth);
        });
    });
  });
});
