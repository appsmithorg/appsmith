const dsl = require("../../../../fixtures/AllWidgetsDsl.json");
const commonlocators = require("../../../../locators/commonlocators.json");
import { ObjectsRegistry } from "../../../../support/Objects/Registry";
const agHelper = ObjectsRegistry.AggregateHelper;
let widgets = [
  "switchwidget",
  "currencyinputwidget",
  "codescannerwidget",
  "listwidgetv2",
  "tablewidgetv2",
  "audiowidget",
  "checkboxwidget",
  "selectwidget",
  "radiogroupwidget",
  "datepickerwidget2",
  "tabswidget",
  "phoneinputwidget",
  "categorysliderwidget",
];
let height = {
  switchwidget: 0,
  currencyinputwidget: 0,
  codescannerwidget: 0,
  listwidgetv2: 0,
  tablewidgetv2: 0,
  audiowidget: 0,
  checkboxwidget: 0,
  selectwidget: 0,
  radiogroupwidget: 0,
  datepickerwidget2: 0,
  tabswidget: 0,
  phoneinputwidget: 0,
  categorysliderwidget: 0,
};
let width = {
  switchwidget: 0,
  currencyinputwidget: 0,
  codescannerwidget: 0,
  listwidgetv2: 0,
  tablewidgetv2: 0,
  audiowidget: 0,
  checkboxwidget: 0,
  selectwidget: 0,
  radiogroupwidget: 0,
  datepickerwidget2: 0,
  tabswidget: 0,
  phoneinputwidget: 0,
  categorysliderwidget: 0,
};

describe("Validating Mobile Views for Auto Fill Widgets", function () {
  afterEach(() => {
    agHelper.SaveLocalStorageCache();
  });

  beforeEach(() => {
    agHelper.RestoreLocalStorageCache();
  });
  it("To capture the height and width of various auto fill widgets in webview", function () {
    cy.wait(5000);
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
    let heightPromises = [];
    let widthPromises = [];
    for (let i = 0; i < widgets.length; i++) {
      let heightPromise = cy
        .get(".t--widget-".concat(widgets[i]))
        .invoke("css", "height")
        .then((newheight) => {
          height[widgets[i]] = newheight;
          cy.log(height[widgets[i]]);
          cy.log(i);
        });
      heightPromises.push(heightPromise);
      let widthPromise = cy
        .get(".t--widget-".concat(widgets[i]))
        .invoke("css", "width")
        .then((newwidth) => {
          width[widgets[i]] = newwidth;
          cy.log(width[widgets[i]]);
          cy.log(i);
        });
      widthPromises.push(widthPromise);
    }
  });

  let phones = [
    [390, 844],
    [360, 780],
  ];
  phones.forEach((phone) => {
    it(`${phone} port execution For Auto Fill Widgets`, function () {
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
      cy.get(".t--widget-codescannerwidget")
        .invoke("css", "height")
        .then((newheight) => {
          expect(height[widgets[2]]).to.equal(newheight);
        });
      cy.get(".t--widget-codescannerwidget")
        .invoke("css", "width")
        .then((newwidth) => {
          expect(width[widgets[2]]).to.not.equal(newwidth);
        });
      cy.get(".t--widget-listwidgetv2")
        .invoke("css", "height")
        .then((newheight) => {
          expect(height[widgets[3]]).to.equal(newheight);
        });
      cy.get(".t--widget-listwidgetv2")
        .invoke("css", "width")
        .then((newwidth) => {
          expect(width[widgets[3]]).to.not.equal(newwidth);
        });
      cy.get(".t--widget-tablewidgetv2")
        .invoke("css", "height")
        .then((newheight) => {
          expect(parseFloat(height[widgets[4]])).to.be.at.least(
            parseFloat(newheight),
          );
        });
      cy.get(".t--widget-tablewidgetv2")
        .invoke("css", "width")
        .then((newwidth) => {
          expect(width[widgets[4]]).to.not.equal(newwidth);
        });
      cy.get(".t--widget-audiowidget")
        .invoke("css", "height")
        .then((newheight) => {
          expect(height[widgets[5]]).to.equal(newheight);
        });
      cy.get(".t--widget-audiowidget")
        .invoke("css", "width")
        .then((newwidth) => {
          expect(width[widgets[5]]).to.not.equal(newwidth);
        });
      cy.get(".t--widget-checkboxwidget")
        .invoke("css", "height")
        .then((newheight) => {
          expect(height[widgets[6]]).to.equal(newheight);
        });
      cy.get(".t--widget-checkboxwidget")
        .invoke("css", "width")
        .then((newwidth) => {
          expect(width[widgets[6]]).to.not.equal(newwidth);
        });
      cy.get(".t--widget-radiogroupwidget")
        .invoke("css", "height")
        .then((newheight) => {
          expect(height[widgets[8]]).to.equal(newheight);
        });
      cy.get(".t--widget-radiogroupwidget")
        .invoke("css", "width")
        .then((newwidth) => {
          expect(width[widgets[8]]).to.not.equal(newwidth);
        });
      cy.get(".t--widget-datepickerwidget2")
        .scrollIntoView()
        .invoke("css", "width")
        .then((newwidth) => {
          expect(parseFloat(width[widgets[9]])).to.be.at.least(
            parseFloat(newwidth),
          );
        });
      cy.get(".t--widget-tabswidget")
        .invoke("css", "height")
        .then((newheight) => {
          expect(parseFloat(height[widgets[10]])).to.be.at.least(
            parseFloat(newheight),
          );
        });
      cy.get(".t--widget-tabswidget")
        .invoke("css", "width")
        .then((newwidth) => {
          expect(parseFloat(width[widgets[10]])).to.be.at.least(
            parseFloat(newwidth),
          );
        });
      cy.get(".t--widget-categorysliderwidget")
        .invoke("css", "height")
        .then((newheight) => {
          expect(height[widgets[12]]).to.equal(newheight);
        });
      cy.get(".t--widget-categorysliderwidget")
        .invoke("css", "width")
        .then((newwidth) => {
          expect(width[widgets[12]]).to.not.equal(newwidth);
        });
    });
  });
});
