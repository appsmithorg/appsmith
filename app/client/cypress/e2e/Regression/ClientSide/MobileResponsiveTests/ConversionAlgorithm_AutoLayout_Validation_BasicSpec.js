import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

const widgets = require("../../../../locators/Widgets.json");
import * as _ from "../../../../support/Objects/ObjectsCore";

let testHeight;

describe(
  "Auto conversion algorithm usecases for auto-layout",
  { tags: ["@tag.MobileResponsive"] },
  function () {
    it("1. Validate basic conversion algorithm usecases", function () {
      _.agHelper.AddDsl("conversionFrAutoLayoutDsl");
      //cy.openPropertyPane("containerwidget");
      cy.get("@getConsolidatedData").then((httpResponse) => {
        const data = httpResponse.response.body.data.pageWithMigratedDsl.data;
        testHeight = data.layouts[0].dsl.bottomRow;
      });

      _.agHelper
        .GetWidgetCSSHeight(
          _.locators._widgetInDeployed(_.draggableWidgets.AUDIORECORDER),
        )
        .then((aheight) => {
          _.agHelper
            .GetWidgetCSSHeight(
              _.locators._widgetInDeployed(_.draggableWidgets.BUTTON_GROUP),
            )
            .then((bheight) => {
              _.agHelper
                .GetWidgetCSSHeight(
                  _.locators._widgetInDeployed(
                    _.draggableWidgets.DOCUMENT_VIEWER,
                  ),
                )
                .then((dheight) => {
                  cy.log(aheight);
                  cy.log(bheight);
                  cy.log(dheight);
                  cy.wait(3000);

                  _.autoLayout.ConvertToAutoLayoutAndVerify();

                  _.agHelper
                    .GetWidgetCSSHeight(
                      _.locators._widgetInDeployed(
                        _.draggableWidgets.AUDIORECORDER,
                      ),
                    )
                    .then((a1height) => {
                      _.agHelper
                        .GetWidgetCSSHeight(
                          _.locators._widgetInDeployed(
                            _.draggableWidgets.BUTTON_GROUP,
                          ),
                        )
                        .then((b1height) => {
                          _.agHelper
                            .GetWidgetCSSHeight(
                              _.locators._widgetInDeployed(
                                _.draggableWidgets.DOCUMENT_VIEWER,
                              ),
                            )
                            .then((d1height) => {
                              expect(aheight).to.not.equal(a1height);
                              expect(bheight).to.not.equal(b1height);
                              expect(dheight).to.not.equal(d1height);

                              _.autoLayout.UseSnapshotFromBanner();

                              _.agHelper
                                .GetWidgetCSSHeight(
                                  _.locators._widgetInDeployed(
                                    _.draggableWidgets.AUDIORECORDER,
                                  ),
                                )
                                .then((raheight) => {
                                  _.agHelper
                                    .GetWidgetCSSHeight(
                                      _.locators._widgetInDeployed(
                                        _.draggableWidgets.BUTTON_GROUP,
                                      ),
                                    )
                                    .then((rbheight) => {
                                      _.agHelper
                                        .GetWidgetCSSHeight(
                                          _.locators._widgetInDeployed(
                                            _.draggableWidgets.DOCUMENT_VIEWER,
                                          ),
                                        )
                                        .then((rdheight) => {
                                          expect(a1height).to.not.equal(
                                            raheight,
                                          );
                                          expect(b1height).to.not.equal(
                                            rbheight,
                                          );
                                          expect(d1height).to.not.equal(
                                            rdheight,
                                          );
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
      _.homePage.NavigateToHome();
      _.homePage.CreateNewApplication();

      _.entityExplorer.DragDropWidgetNVerify(
        _.draggableWidgets.INPUT_V2,
        300,
        50,
      );
      _.entityExplorer.DragDropWidgetNVerify(
        _.draggableWidgets.CURRENCY_INPUT,
        300,
        200,
      );
      _.entityExplorer.DragDropWidgetNVerify(
        _.draggableWidgets.MULTISELECT,
        300,
        350,
      );

      _.agHelper
        .GetWidgetCSSHeight(
          _.locators._widgetInDeployed(_.draggableWidgets.INPUT_V2),
        )
        .then((aheight) => {
          _.agHelper
            .GetWidgetCSSHeight(
              _.locators._widgetInDeployed(_.draggableWidgets.CURRENCY_INPUT),
            )
            .then((bheight) => {
              _.agHelper
                .GetWidgetCSSHeight(
                  _.locators._widgetInDeployed(_.draggableWidgets.MULTISELECT),
                )
                .then((dheight) => {
                  cy.log(aheight);
                  cy.log(bheight);
                  cy.log(dheight);
                  cy.wait(3000);

                  _.autoLayout.ConvertToAutoLayoutAndVerify();

                  _.agHelper
                    .GetWidgetCSSHeight(
                      _.locators._widgetInDeployed(_.draggableWidgets.INPUT_V2),
                    )
                    .then((a1height) => {
                      _.agHelper
                        .GetWidgetCSSHeight(
                          _.locators._widgetInDeployed(
                            _.draggableWidgets.CURRENCY_INPUT,
                          ),
                        )
                        .then((b1height) => {
                          _.agHelper
                            .GetWidgetCSSHeight(
                              _.locators._widgetInDeployed(
                                _.draggableWidgets.MULTISELECT,
                              ),
                            )
                            .then((d1height) => {
                              expect(aheight).to.not.equal(a1height);
                              expect(bheight).to.not.equal(b1height);
                              expect(dheight).to.not.equal(d1height);

                              _.autoLayout.UseSnapshotFromBanner();

                              _.agHelper
                                .GetWidgetCSSHeight(
                                  _.locators._widgetInDeployed(
                                    _.draggableWidgets.INPUT_V2,
                                  ),
                                )
                                .then((raheight) => {
                                  _.agHelper
                                    .GetWidgetCSSHeight(
                                      _.locators._widgetInDeployed(
                                        _.draggableWidgets.CURRENCY_INPUT,
                                      ),
                                    )
                                    .then((rbheight) => {
                                      _.agHelper
                                        .GetWidgetCSSHeight(
                                          _.locators._widgetInDeployed(
                                            _.draggableWidgets.MULTISELECT,
                                          ),
                                        )
                                        .then((rdheight) => {
                                          expect(a1height).to.not.equal(
                                            raheight,
                                          );
                                          expect(b1height).to.not.equal(
                                            rbheight,
                                          );
                                          expect(d1height).to.not.equal(
                                            rdheight,
                                          );
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
      _.homePage.NavigateToHome();
      _.homePage.CreateNewApplication();

      const canvasTypeWidgets = [
        _.draggableWidgets.CONTAINER,
        _.draggableWidgets.FORM,
        _.draggableWidgets.LIST_V2,
        _.draggableWidgets.TAB,
      ];

      let x = 300,
        y = 50;
      canvasTypeWidgets.forEach((canvasWidget, index) => {
        _.entityExplorer.DragDropWidgetNVerify(canvasWidget, x, y);

        //Logic to add widgets without overlapping each other on the canvas
        if (index % 2 === 0) {
          x += 300;
        } else {
          x = 300;
          y += 400;
        }
      });
      _.entityExplorer.DragDropWidgetNVerify(_.draggableWidgets.MODAL);
      cy.wait(1000);
      _.agHelper.GetNClick(widgets.modalCloseButton, 0, true);

      _.autoLayout.ConvertToAutoLayoutAndVerify();

      canvasTypeWidgets.forEach((canvasWidget) => {
        _.autoLayout.VerifyCurrentWidgetIsAutolayout(canvasWidget);
      });
      EditorNavigation.SelectEntityByName("Modal1", EntityType.Widget);
      _.autoLayout.VerifyCurrentWidgetIsAutolayout(_.draggableWidgets.MODAL);
      cy.wait(1000);
      _.agHelper.GetNClick(widgets.modalCloseButton, 0, true);

      _.autoLayout.ConvertToFixedLayoutAndVerify("DESKTOP");

      canvasTypeWidgets.forEach((canvasWidget) => {
        _.autoLayout.VerifyCurrentWidgetIsFixedlayout(canvasWidget);
      });
      EditorNavigation.SelectEntityByName("Modal1", EntityType.Widget);
      _.autoLayout.VerifyCurrentWidgetIsFixedlayout(_.draggableWidgets.MODAL);
      cy.wait(1000);
      _.agHelper.GetNClick(widgets.modalCloseButton, 0, true);
    });
  },
);
