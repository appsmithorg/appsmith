import * as _ from "../../../../support/Objects/ObjectsCore";

let theight;
let twidth;

describe(
  "Validating Mobile View related usecases for Autoscroll",
  { tags: ["@tag.MobileResponsive"] },
  function () {
    it("1. Capture the height/width of autofill widgets in webview", function () {
      _.autoLayout.ConvertToAutoLayoutAndVerify(false);

      cy.dragAndDropToCanvas("listwidgetv2", { x: 100, y: 200 });
      cy.dragAndDropToCanvas("containerwidget", { x: 620, y: 820 });
      for (let i = 0; i < 10; i++) {
        cy.dragAndDropToCanvas("inputwidgetv2", { x: 450, y: 530 });
      }
      cy.get(".t--widget-inputwidgetv2").first().should("be.visible");
      _.deployMode.DeployApp();
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

    let phones = [
      [390, 844],
      [360, 780],
    ];
    phones.forEach((phone, index) => {
      it(`${index + 2}. ${phone} port execution for autoscroll`, function () {
        if (Cypress._.isArray(phone)) {
          cy.viewport(phone[0], phone[1]);
        } else {
          cy.viewport(phone);
        }
        cy.wait(2000);
        for (let i = 0; i < 10; i++) {
          cy.get(".t--widget-inputwidgetv2")
            .eq(i)
            .scrollIntoView()
            .invoke("css", "height")
            .then((newheight) => {
              expect(theight).to.equal(newheight);
            });
          cy.get(".t--widget-inputwidgetv2")
            .eq(i)
            .scrollIntoView()
            .invoke("css", "width")
            .then((newwidth) => {
              expect(twidth).to.not.equal(newwidth);
            });
        }
      });
    });
  },
);
