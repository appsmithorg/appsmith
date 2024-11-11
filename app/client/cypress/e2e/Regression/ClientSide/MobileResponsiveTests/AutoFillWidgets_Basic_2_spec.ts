import * as _ from "../../../../support/Objects/ObjectsCore";

let widgets = [
  "codescannerwidget",
  "listwidgetv2",
  "tablewidgetv2",
  "tabswidget",
];
let height = {
  codescannerwidget: 0,
  listwidgetv2: 0,
  tablewidgetv2: 0,
  tabswidget: 0,
};
let width = {
  codescannerwidget: 0,
  listwidgetv2: 0,
  tablewidgetv2: 0,
  tabswidget: 0,
};

describe(
  "Validating Mobile Views for Auto Fill Widgets",
  { tags: ["@tag.MobileResponsive"] },
  function () {
    it("1. To capture the height and width of various autofill / Hug widgets in webview", function () {
      _.autoLayout.ConvertToAutoLayoutAndVerify(false);
      cy.dragAndDropToCanvas("codescannerwidget", { x: 100, y: 200 });
      cy.dragAndDropToCanvas("listwidgetv2", { x: 620, y: 820 });
      cy.dragAndDropToCanvas("tablewidgetv2", { x: 620, y: 820 });
      cy.dragAndDropToCanvas("tabswidget", { x: 670, y: 770 });
      cy.wait(2000);
      _.deployMode.DeployApp();
      cy.wait(2000);
      for (let i = 0; i < widgets.length; i++) {
        cy.get(".t--widget-".concat(widgets[i]))
          .invoke("css", "height")
          .then((newheight) => {
            height[widgets[i]] = newheight;
            cy.log(height[widgets[i]]);
          });
        cy.get(".t--widget-".concat(widgets[i]))
          .invoke("css", "width")
          .then((newwidth) => {
            width[widgets[i]] = newwidth;
            cy.log(width[widgets[i]]);
          });
      }
    });

    let phones = [
      [390, 844],
      [360, 780],
    ];
    phones.forEach((phone, index) => {
      it(`${
        index + 2
      }. ${phone} port execution For Auto Fill Widgets`, function () {
        if (Cypress._.isArray(phone)) {
          cy.viewport(phone[0], phone[1]);
        } else {
          cy.viewport(phone);
        }
        cy.wait(2000);
        cy.get(".t--widget-codescannerwidget")
          .invoke("css", "height")
          .then((newheight) => {
            expect(height[widgets[0]]).to.equal(newheight);
          });
        cy.get(".t--widget-codescannerwidget")
          .invoke("css", "width")
          .then((newwidth) => {
            expect(width[widgets[0]]).to.not.equal(newwidth);
          });
        cy.get(".t--widget-listwidgetv2")
          .invoke("css", "height")
          .then((newheight) => {
            expect(height[widgets[1]]).to.equal(newheight);
          });
        cy.get(".t--widget-listwidgetv2")
          .invoke("css", "width")
          .then((newwidth) => {
            expect(width[widgets[1]]).to.not.equal(newwidth);
          });
        cy.get(".t--widget-tablewidgetv2")
          .invoke("css", "height")
          .then((newheight) => {
            expect(height[widgets[2]]).to.equal(newheight);
          });
        cy.get(".t--widget-tablewidgetv2")
          .invoke("css", "width")
          .then((newwidth) => {
            expect(width[widgets[2]]).to.not.equal(newwidth);
          });
        cy.get(".t--widget-tabswidget")
          .invoke("css", "width")
          .then((newwidth) => {
            expect(width[widgets[3]]).to.not.equal(newwidth);
          });
      });
    });
  },
);
