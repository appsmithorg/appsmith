const dsl = require("../../../../fixtures/ImageHugWidgetDsl.json");
const commonlocators = require("../../../../locators/commonlocators.json");
import { ObjectsRegistry } from "../../../../support/Objects/Registry";
const agHelper = ObjectsRegistry.AggregateHelper;
let cheight;
let theight;
let cwidth;
let twidth;

describe("Validating Mobile Views", function () {

  afterEach(() => {
    agHelper.SaveLocalStorageCache();
  });

  beforeEach(() => {
    agHelper.RestoreLocalStorageCache();
  });
  it("Validate change with height width for widgets", function () {
    cy.addDsl(dsl);
    cy.wait(5000); //for dsl to settle
    cy.PublishtheApp();
    cy.wait(2000);
  })

  let phones = ["iphone-4", "iphone-5", "iphone-6", "iphone-6+", "iphone-7",
    "iphone-8", "iphone-x", "samsung-note9", "samsung-s10"]
  phones.forEach((phone) => {
    it(`${phone} port execution`, function () {
      if (Cypress._.isArray(phone)) {
        cy.viewport(phone[0], phone[1])
      } else {
        cy.viewport(phone)
      }
      cy.wait(5000);
      cy.get(".t--widget-imagewidget")
      .first()
      .invoke("css", "width")
      .then((width) => {        
        expect(parseFloat(width)).to.greaterThan(parseFloat("250px"));
    });
  });
  });
});