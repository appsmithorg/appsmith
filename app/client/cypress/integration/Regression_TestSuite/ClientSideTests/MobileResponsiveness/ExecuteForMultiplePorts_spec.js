const dsl = require("../../../../fixtures/mobileresponisvenessDsl.json");
const commonlocators = require("../../../../locators/commonlocators.json");
import { ObjectsRegistry } from "../../../../support/Objects/Registry";
const agHelper = ObjectsRegistry.AggregateHelper;
let cheight;
let theight;
let cwidth;
let twidth;
let testHeight;
let mtestHeight;

describe("Validating Mobile Views", function() {

  afterEach(() => {
    agHelper.SaveLocalStorageCache();
  });

  beforeEach(() => {
    agHelper.RestoreLocalStorageCache();
  });
  it("Validate change with height width for widgets", function() {
    cy.addDsl(dsl);
    cy.wait(5000); //for dsl to settle
    //cy.openPropertyPane("containerwidget");
    cy.get("@getPage").then((httpResponse) => {
      const data = httpResponse.response.body.data;
      //testHeight = data.layouts[0].dsl.bottomRow;
      //expect(testHeight).to.equal(380);
    });
    cy.get(".t--entity-name:contains('Container1')").click({force: true});
    cy.get(".t--widget-containerwidget")
      .invoke("css", "height")
      .then((height) => {
        cy.get(".t--widget-tablewidgetv2")
          .invoke("css", "height")
          .then((newheight) => {
        
            cy.PublishtheApp();
            cy.get(".t--widget-containerwidget")
            .invoke("css", "height")
            .then((height) => {
              cy.get(".t--widget-tablewidgetv2")
                .invoke("css", "height")
                .then((newheight) => {
                  cheight=height;
                  theight=newheight;
                });
              });
              cy.get(".t--widget-containerwidget")
              .invoke("css", "width")
              .then((width) => {
                cy.get(".t--widget-tablewidgetv2")
                  .invoke("css", "width")
                  .then((newwidth) => {
                    cwidth=width;
                    twidth=newwidth;
                  });
                });
              
            //expect(height).to.equal(newheight);
          });            
      });
  });

    let phones = ["iphone-3","iphone-4", "iphone-5", "iphone-6", "iphone-6+", "iphone-7",
    "iphone-8", "iphone-x", "samsung-note9", "samsung-s10"]
    phones.forEach((phone) => {
        it(`${phone} port execution`, function() {

            if (Cypress._.isArray(phone)) {
                cy.viewport(phone[0], phone[1])
              } else {
                cy.viewport(phone)
              }
            //cy.wait(5000)  
            cy.reload();
            cy.wait(5000)  
            cy.get("@viewPage").then((httpResponse) => {
              const data = httpResponse.response.body.data;
              //mtestHeight = data.layouts[0].dsl.bottomRow;
              //expect(testHeight).to.not.equal(mtestHeight);
            })
            cy.wait(5000)  
            cy.get(".t--widget-containerwidget")
            .invoke("css", "height")
            .then((height) => {
              cy.get(".t--widget-tablewidgetv2")
                .invoke("css", "height")
                .then((newheight) => {
                expect(cheight).to.not.equal(height);
                expect(theight).to.equal(newheight);
                });
              });
              cy.get(".t--widget-containerwidget")
              .invoke("css", "width")
              .then((width) => {
                cy.get(".t--widget-tablewidgetv2")
                  .invoke("css", "width")
                  .then((newwidth) => {
                  expect(cwidth).to.not.equal(width);
                  expect(twidth).to.not.equal(newwidth);
                  });
                });
        });
    })
});