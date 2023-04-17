const dsl = require("../../../../fixtures/AllWidgetsDsl.json");
const commonlocators = require("../../../../locators/commonlocators.json");
import { ObjectsRegistry } from "../../../../support/Objects/Registry";
const agHelper = ObjectsRegistry.AggregateHelper;
let theight;
let twidth;

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
    let widgets = ["switchwidget", "currencyinputwidget", "codescannerwidget"];
    let height = {
      switchwidget: 0,
      currencyinputwidget: 0,
      codescannerwidget: 0,
    };
    let width = {
      switchwidget: 0,
      currencyinputwidget: 0,
      codescannerwidget: 0,
    };

    let heightPromises = [];
    let widthPromises = [];

    for (let i = 0; i < widgets.length; i++) {
      let heightPromise = cy
        .get(".t--widget-".concat(widgets[i]))
        .invoke("css", "height")
        .then((newheight) => {
          height[widgets[i]] = newheight;
          cy.log(height[widgets[i]]);
        });
      heightPromises.push(heightPromise);

      let widthPromise = cy
        .get(".t--widget-".concat(widgets[i]))
        .invoke("css", "width")
        .then((newwidth) => {
          width[widgets[i]] = newwidth;
          cy.log(width[widgets[i]]);
        });
      widthPromises.push(widthPromise);
    }

    Promise.all([...heightPromises, ...widthPromises]).then(() => {
      for (let i = 0; i < widgets.length; i++) {
        cy.log(width[widgets[i]]);
        cy.log(height[widgets[i]]);
      }
    });
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
