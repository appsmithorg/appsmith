import * as _ from "../../../../support/Objects/ObjectsCore";

let theight;
let twidth;

describe(
  "Validating Mobile Views for Fill Widget",
  { tags: ["@tag.MobileResponsive"] },
  function () {
    it("Validate change with height width for fill widget - Input widget", function () {
      _.autoLayout.ConvertToAutoLayoutAndVerify(false);
      cy.dragAndDropToCanvas("inputwidgetv2", { x: 100, y: 200 });
      cy.dragAndDropToCanvas("inputwidgetv2", { x: 10, y: 20 });
      _.deployMode.DeployApp();
      cy.get(".t--widget-inputwidgetv2").first().should("be.visible");
      cy.get(".t--widget-inputwidgetv2").last().should("be.visible");
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
    //Added viewports of iphone14 and samsung galaxy s22 for testing purpose
    let phones = ["iphone-4", "samsung-s10", [390, 844], [360, 780]];
    phones.forEach((phone, index) => {
      it(`${
        index + 2
      }. ${phone} port execution for fill widget - input widget`, function () {
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
  },
);
