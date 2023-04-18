const dsl = require("../../../../fixtures/AllWidgetsDsl.json");
const commonlocators = require("../../../../locators/commonlocators.json");
import { ObjectsRegistry } from "../../../../support/Objects/Registry";
const agHelper = ObjectsRegistry.AggregateHelper;
let theight;
let twidth;
 let widgets = ["switchwidget", "currencyinputwidget", "codescannerwidget","listwidgetv2","tablewidgetv2","audiowidget","checkboxwidget"];
    let height = {
      switchwidget: 0,
      currencyinputwidget: 0,
      codescannerwidget: 0,
      listwidgetv2: 0,
      tablewidgetv2: 0,
      audiowidget: 0,
      checkboxwidget: 0,
    };
    let width = {
      switchwidget: 0,
      currencyinputwidget: 0,
      codescannerwidget: 0,
      listwidgetv2: 0,
      tablewidgetv2: 0,
      audiowidget: 0,
      checkboxwidget: 0,
    };

describe("Validating Mobile Views", function () {
  afterEach(() => {
    agHelper.SaveLocalStorageCache();
  });

  beforeEach(() => {
    agHelper.RestoreLocalStorageCache();
  });
  it("Validate change with height width for widgets", function () {
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
      for (let i = 0; i < widgets.length; i++) {
        cy.log(height[widgets[i]]);
        cy.log(width[widgets[i]]);
      }
  });

  let phones = ["iphone-4", "samsung-s10", [390, 844], [360, 780]];
  phones.forEach((phone) => {
    it(`${phone} port execution`, function () {
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
    });
  });
});
