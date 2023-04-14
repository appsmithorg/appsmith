const dsl = require("../../../../fixtures/conversionFrAutoLayoutDsl.json");
const commonlocators = require("../../../../locators/commonlocators.json");
import { ObjectsRegistry } from "../../../../support/Objects/Registry";
const agHelper = ObjectsRegistry.AggregateHelper;
let testHeight;

describe("Auto conversion algorithm usecases for fixed Layout", function () {
  afterEach(() => {
    agHelper.SaveLocalStorageCache();
  });

  beforeEach(() => {
    agHelper.RestoreLocalStorageCache();
  });
  it("Validate basic conversion algorithm usecases fixed layout Desktop", function () {
    cy.addDsl(dsl);
    cy.wait(5000); //for dsl to settle
    //cy.openPropertyPane("containerwidget");
    cy.get("@getPage").then((httpResponse) => {
      const data = httpResponse.response.body.data;
      testHeight = data.layouts[0].dsl.bottomRow;
      //expect(testHeight).to.equal(380);
    });
    cy.get(".t--widget-audiorecorderwidget")
      .invoke("css", "height")
      .then((aheight) => {
        cy.get(".t--widget-buttongroupwidget")
          .invoke("css", "height")
          .then((bheight) => {
            cy.get(".t--widget-documentviewerwidget")
              .invoke("css", "height")
              .then((dheight) => {
                cy.log(aheight);
                cy.log(bheight);
                cy.log(dheight);
                cy.wait(3000);
                cy.get(commonlocators.autoConvert).click({ force: true });
                cy.wait(2000);
                cy.get(commonlocators.convert).click({ force: true });
                cy.wait(2000);
                cy.get(commonlocators.refreshApp).click({ force: true });
                cy.wait(2000);
                cy.wait("@updateLayout").should(
                  "have.nested.property",
                  "response.body.responseMeta.status",
                  200,
                );
                cy.get(".t--widget-audiorecorderwidget")
                  .invoke("css", "height")
                  .then((a1height) => {
                    cy.get(".t--widget-buttongroupwidget")
                      .invoke("css", "height")
                      .then((b1height) => {
                        cy.get(".t--widget-documentviewerwidget")
                          .invoke("css", "height")
                          .then((d1height) => {
                            expect(aheight).to.not.equal(a1height);
                            expect(bheight).to.not.equal(b1height);
                            expect(dheight).to.not.equal(d1height);
                            cy.get(commonlocators.discardSnapshot).click({
                              force: true,
                            });
                            cy.wait(2000);
                            cy.get(commonlocators.discard).click({
                              force: true,
                            });
                            cy.reload();
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
                            /*
                            cy.wait("@updateLayout").should(
                              "have.nested.property",
                              "response.body.responseMeta.status",
                              200,
                            );
                            */
                            cy.wait(15000);
                            cy.get(".t--widget-audiorecorderwidget")
                              .invoke("css", "height")
                              .then((raheight) => {
                                cy.get(".t--widget-buttongroupwidget")
                                  .invoke("css", "height")
                                  .then((rbheight) => {
                                    cy.get(".t--widget-documentviewerwidget")
                                      .invoke("css", "height")
                                      .then((rdheight) => {
                                        expect(a1height).to.not.equal(raheight);
                                        expect(b1height).to.not.equal(rbheight);
                                        expect(d1height).to.not.equal(rdheight);
                                        expect(aheight).to.equal(raheight);
                                        expect(bheight).to.equal(rbheight);
                                        expect(dheight).to.equal(rdheight);
                                      });
                                  });
                              });
                          });
                      });
                  });
              });
          });
      });
  });
});
