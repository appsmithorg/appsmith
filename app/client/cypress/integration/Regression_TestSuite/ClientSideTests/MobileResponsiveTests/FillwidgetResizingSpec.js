const dsl = require("../../../../fixtures/inputWidgetMobileDsl.json");
const commonlocators = require("../../../../locators/commonlocators.json");
let theight;
let twidth;

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
    //cy.openPropertyPane("containerwidget");
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

  let phones = ["iphone-4", "samsung-s10", [390, 844], [360, 780]];
  phones.forEach((phone, index) => {
    it(`${index + 1}. ${phone} port execution`, function () {
      if (Cypress._.isArray(phone)) {
        cy.viewport(phone[0], phone[1]);
      } else {
        cy.viewport(phone);
      }
      cy.wait(2000);
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
