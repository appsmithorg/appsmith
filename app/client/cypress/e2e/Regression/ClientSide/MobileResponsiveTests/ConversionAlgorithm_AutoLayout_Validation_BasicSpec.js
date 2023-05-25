const dsl = require("../../../../fixtures/conversionFrAutoLayoutDsl.json");
const widgets = require("../../../../locators/Widgets.json");
import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const autoLayout = ObjectsRegistry.AutoLayout,
  home = ObjectsRegistry.HomePage,
  ee = ObjectsRegistry.EntityExplorer;
let testHeight;

describe("Auto conversion algorithm usecases for Autolayout", function () {
  it("1. Validate basic conversion algorithm usecases", function () {
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

                autoLayout.convertToAutoLayoutAndVerify();

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

                            autoLayout.useSnapshotFromBanner();

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

  it("2. Validate input type widgets have ", function () {
    home.NavigateToHome();
    home.CreateNewApplication();

    ee.DragDropWidgetNVerify("inputwidgetv2", 300, 50);
    ee.DragDropWidgetNVerify("currencyinputwidget", 300, 200);
    ee.DragDropWidgetNVerify("multiselectwidgetv2", 300, 350);

    cy.get(".t--widget-inputwidgetv2")
      .invoke("css", "height")
      .then((aheight) => {
        cy.get(".t--widget-currencyinputwidget")
          .invoke("css", "height")
          .then((bheight) => {
            cy.get(".t--widget-multiselectwidgetv2")
              .invoke("css", "height")
              .then((dheight) => {
                cy.log(aheight);
                cy.log(bheight);
                cy.log(dheight);
                cy.wait(3000);

                autoLayout.convertToAutoLayoutAndVerify();

                cy.get(".t--widget-inputwidgetv2")
                  .invoke("css", "height")
                  .then((a1height) => {
                    cy.get(".t--widget-currencyinputwidget")
                      .invoke("css", "height")
                      .then((b1height) => {
                        cy.get(".t--widget-multiselectwidgetv2")
                          .invoke("css", "height")
                          .then((d1height) => {
                            expect(aheight).to.not.equal(a1height);
                            expect(bheight).to.not.equal(b1height);
                            expect(dheight).to.not.equal(d1height);

                            autoLayout.useSnapshotFromBanner();

                            cy.get(".t--widget-inputwidgetv2")
                              .invoke("css", "height")
                              .then((raheight) => {
                                cy.get(".t--widget-currencyinputwidget")
                                  .invoke("css", "height")
                                  .then((rbheight) => {
                                    cy.get(".t--widget-multiselectwidgetv2")
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

  it("3. All the Canvas type widgets should convert to Auto layout post conversion", () => {
    home.NavigateToHome();
    home.CreateNewApplication();

    const canvasTypeWidgets = [
      "containerwidget",
      "formwidget",
      "listwidgetv2",
      "tabswidget",
    ];

    let x = 300,
      y = 50;
    canvasTypeWidgets.forEach((canvasWidget, index) => {
      ee.DragDropWidgetNVerify(canvasWidget, x, y);

      if (index % 2 === 0) {
        x += 400;
      } else {
        x = 300;
        y += 400;
      }
    });
    ee.DragDropWidgetNVerify("modalwidget");
    cy.wait(1000);
    cy.get(widgets.modalCloseButton).click({ force: true });

    autoLayout.convertToAutoLayoutAndVerify();

    canvasTypeWidgets.forEach((canvasWidget) => {
      autoLayout.verifyCurrentWidgetIsAutolayout(canvasWidget);
    });
    ee.SelectEntityByName("Modal1", "Widgets");
    autoLayout.verifyCurrentWidgetIsAutolayout("modalwidget");
    cy.wait(1000);
    cy.get(widgets.modalCloseButton).click({ force: true });

    autoLayout.convertToFixedLayoutAndVerify("DESKTOP");

    canvasTypeWidgets.forEach((canvasWidget) => {
      autoLayout.verifyCurrentWidgetIsFixedlayout(canvasWidget);
    });
    ee.SelectEntityByName("Modal1", "Widgets");
    autoLayout.verifyCurrentWidgetIsFixedlayout("modalwidget");
    cy.wait(1000);
    cy.get(widgets.modalCloseButton).click({ force: true });
  });
});
