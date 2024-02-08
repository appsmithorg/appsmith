import * as _ from "../../../../support/Objects/ObjectsCore";

describe(
  "Validating Mobile Views for Hug Widget",
  { tags: ["@tag.MobileResponsive"] },
  function () {
    it("1. Validate change with height width for hug widget - image widget", function () {
      _.autoLayout.ConvertToAutoLayoutAndVerify(false);
      cy.dragAndDropToCanvas("imagewidget", { x: 300, y: 600 });
      _.deployMode.DeployApp();
      cy.get(".t--widget-imagewidget").first().should("be.visible");
    });
    //Added viewports of iphone14 and samsung galaxy s22 for testing purpose
    let phones = ["iphone-4", "samsung-s10", [390, 844], [360, 780]];
    phones.forEach((phone, index) => {
      it(`${
        index + 2
      }. ${phone} port execution for hug widget -image widget `, function () {
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
  },
);
