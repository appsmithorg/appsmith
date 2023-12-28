import * as _ from "../../../../support/Objects/ObjectsCore";

let widgets = [
  "switchwidget",
  "currencyinputwidget",
  "audiowidget",
  "checkboxwidget",
  "selectwidget",
  "radiogroupwidget",
  "datepickerwidget2",
  "phoneinputwidget",
  "categorysliderwidget",
];
let height = {
  switchwidget: 0,
  currencyinputwidget: 0,
  audiowidget: 0,
  checkboxwidget: 0,
  selectwidget: 0,
  radiogroupwidget: 0,
  datepickerwidget2: 0,
  phoneinputwidget: 0,
  categorysliderwidget: 0,
};
let width = {
  switchwidget: 0,
  currencyinputwidget: 0,
  audiowidget: 0,
  checkboxwidget: 0,
  selectwidget: 0,
  radiogroupwidget: 0,
  datepickerwidget2: 0,
  phoneinputwidget: 0,
  categorysliderwidget: 0,
};

describe(
  "Validating Mobile Views for Auto Fill Widgets",
  { tags: ["@tag.MobileResponsive"] },
  function () {
    it("1. To capture the height and width of various autofill / Hug widgets in webview", function () {
      _.autoLayout.ConvertToAutoLayoutAndVerify(false);

      cy.dragAndDropToCanvas("switchwidget", { x: 100, y: 200 });
      cy.dragAndDropToCanvas("currencyinputwidget", { x: 110, y: 210 });
      cy.dragAndDropToCanvas("audiowidget", { x: 250, y: 300 });
      cy.dragAndDropToCanvas("selectwidget", { x: 560, y: 560 });
      cy.dragAndDropToCanvas("checkboxwidget", { x: 670, y: 770 });
      cy.dragAndDropToCanvas("radiogroupwidget", { x: 670, y: 770 });
      cy.dragAndDropToCanvas("datepickerwidget2", { x: 670, y: 970 });
      cy.dragAndDropToCanvas("phoneinputwidget", { x: 660, y: 810 });
      cy.dragAndDropToCanvas("categorysliderwidget", { x: 620, y: 810 });
      cy.wait(5000);
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
        cy.get(".t--widget-switchwidget")
          .invoke("css", "height")
          .then((newheight) => {
            expect(height[widgets[0]]).to.equal(newheight);
          });
        cy.get(".t--widget-switchwidget")
          .invoke("css", "width")
          .then((newwidth) => {
            expect(width[widgets[0]]).to.not.equal(newwidth);
          });
        cy.get(".t--widget-currencyinputwidget")
          .invoke("css", "height")
          .then((newheight) => {
            expect(height[widgets[1]]).to.equal(newheight);
          });
        cy.get(".t--widget-currencyinputwidget")
          .invoke("css", "width")
          .then((newwidth) => {
            expect(width[widgets[1]]).to.not.equal(newwidth);
          });
        cy.get(".t--widget-audiowidget")
          .invoke("css", "height")
          .then((newheight) => {
            expect(height[widgets[2]]).to.equal(newheight);
          });
        cy.get(".t--widget-audiowidget")
          .invoke("css", "width")
          .then((newwidth) => {
            expect(width[widgets[2]]).to.not.equal(newwidth);
          });
        cy.get(".t--widget-selectwidget")
          .invoke("css", "height")
          .then((newheight) => {
            expect(parseFloat(height[widgets[3]])).to.not.equal(
              parseFloat(newheight),
            );
          });
        cy.get(".t--widget-selectwidget")
          .invoke("css", "width")
          .then((newwidth) => {
            expect(parseFloat(width[widgets[3]])).to.not.equal(
              parseFloat(newwidth),
            );
          });
        cy.get(".t--widget-checkboxwidget")
          .invoke("css", "width")
          .then((newwidth) => {
            expect(parseFloat(width[widgets[4]])).to.not.equal(
              parseFloat(newwidth),
            );
          });
        cy.get(".t--widget-radiogroupwidget")
          .invoke("css", "height")
          .then((newheight) => {
            expect(parseFloat(height[widgets[5]])).to.equal(
              parseFloat(newheight),
            );
          });
        cy.get(".t--widget-radiogroupwidget")
          .invoke("css", "width")
          .then((newwidth) => {
            expect(parseFloat(width[widgets[5]])).to.not.equal(
              parseFloat(newwidth),
            );
          });
        cy.get(".t--widget-datepickerwidget2")
          .scrollIntoView()
          .invoke("css", "width")
          .then((newwidth) => {
            expect(parseFloat(width[widgets[6]])).to.be.at.least(
              parseFloat(newwidth),
            );
          });
        cy.get(".t--widget-phoneinputwidget")
          .invoke("css", "height")
          .then((newheight) => {
            expect(parseFloat(height[widgets[7]])).to.equal(
              parseFloat(newheight),
            );
          });
        cy.get(".t--widget-phoneinputwidget")
          .invoke("css", "width")
          .then((newwidth) => {
            expect(parseFloat(width[widgets[7]])).to.not.equal(
              parseFloat(newwidth),
            );
          });
        cy.get(".t--widget-categorysliderwidget")
          .invoke("css", "height")
          .then((newheight) => {
            expect(parseFloat(height[widgets[8]])).to.equal(
              parseFloat(newheight),
            );
          });
        cy.get(".t--widget-categorysliderwidget")
          .invoke("css", "width")
          .then((newwidth) => {
            expect(width[widgets[8]]).to.not.equal(parseFloat(newwidth));
          });
      });
    });
  },
);
