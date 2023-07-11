import {
  entityExplorer,
  agHelper,
  locators,
  draggableWidgets,
} from "../../../../support/Objects/ObjectsCore";

describe("Dynamic Height Width validation", function () {
  function validateCssProperties(property) {
    agHelper.GetNClickByContains("button", "Small", 0, true);
    agHelper.Sleep(3000);
    entityExplorer.SelectEntityByName("Text1");
    agHelper
      .GetWidgetCSSFrAttribute(
        locators._widgetInDeployed(draggableWidgets.TEXT),
        property,
        0,
      )
      .then((CurrentValueOfFirstText) => {
        entityExplorer.SelectEntityByName("Text2");
        agHelper
          .GetWidgetCSSFrAttribute(
            locators._widgetInDeployed(draggableWidgets.TEXT),
            property,
            1,
          )
          .then((CurrentValueOfSecondText) => {
            entityExplorer.SelectEntityByName("Text3");
            agHelper
              .GetWidgetCSSFrAttribute(
                locators._widgetInDeployed(draggableWidgets.TEXT),
                property,
                2,
              )
              .then((CurrentValueOfThirdText) => {
                entityExplorer.SelectEntityByName("Text4");
                agHelper
                  .GetWidgetCSSFrAttribute(
                    locators._widgetInDeployed(draggableWidgets.TEXT),
                    property,
                    3,
                  )
                  .then((CurrentValueOfFourthText) => {
                    agHelper.GetNClickByContains("button", "Large", 0, true);
                    agHelper.Sleep(3000);
                    entityExplorer.SelectEntityByName("Text1");
                    agHelper
                      .GetWidgetCSSFrAttribute(
                        locators._widgetInDeployed(draggableWidgets.TEXT),
                        property,
                        0,
                      )
                      .then((UpdatedLargeValueOfFirstText) => {
                        entityExplorer.SelectEntityByName("Text2");
                        agHelper
                          .GetWidgetCSSFrAttribute(
                            locators._widgetInDeployed(draggableWidgets.TEXT),
                            property,
                            1,
                          )
                          .then((UpdatedLargeValueOfSecondText) => {
                            entityExplorer.SelectEntityByName("Text3");
                            agHelper
                              .GetWidgetCSSFrAttribute(
                                locators._widgetInDeployed(
                                  draggableWidgets.TEXT,
                                ),
                                property,
                                2,
                              )
                              .then((UpdatedLargeValueOfThirdText) => {
                                entityExplorer.SelectEntityByName("Text4");
                                agHelper
                                  .GetWidgetCSSFrAttribute(
                                    locators._widgetInDeployed(
                                      draggableWidgets.TEXT,
                                    ),
                                    property,
                                    3,
                                  )
                                  .then((UpdatedLargeValueOfFourthText) => {
                                    if (property == "left") {
                                      expect(CurrentValueOfFirstText).to.equal(
                                        UpdatedLargeValueOfFirstText,
                                      );
                                      expect(CurrentValueOfSecondText).to.equal(
                                        UpdatedLargeValueOfSecondText,
                                      );
                                      expect(CurrentValueOfThirdText).to.equal(
                                        UpdatedLargeValueOfThirdText,
                                      );
                                      expect(CurrentValueOfFourthText).to.equal(
                                        UpdatedLargeValueOfFourthText,
                                      );
                                    } else {
                                      expect(
                                        CurrentValueOfFirstText,
                                      ).to.not.equal(
                                        UpdatedLargeValueOfFirstText,
                                      );
                                      expect(
                                        CurrentValueOfSecondText,
                                      ).to.not.equal(
                                        UpdatedLargeValueOfSecondText,
                                      );
                                      expect(
                                        CurrentValueOfThirdText,
                                      ).to.not.equal(
                                        UpdatedLargeValueOfThirdText,
                                      );
                                      expect(
                                        CurrentValueOfFourthText,
                                      ).to.not.equal(
                                        UpdatedLargeValueOfFourthText,
                                      );
                                    }
                                    agHelper.GetNClickByContains(
                                      "button",
                                      "Small",
                                      0,
                                      true,
                                    );
                                    agHelper.Sleep(3000);
                                    entityExplorer.SelectEntityByName("Text1");
                                    agHelper
                                      .GetWidgetCSSFrAttribute(
                                        locators._widgetInDeployed(
                                          draggableWidgets.TEXT,
                                        ),
                                        property,
                                        0,
                                      )
                                      .then((UpdatedSmallValueOfFirstText) => {
                                        entityExplorer.SelectEntityByName(
                                          "Text2",
                                        );
                                        agHelper
                                          .GetWidgetCSSFrAttribute(
                                            locators._widgetInDeployed(
                                              draggableWidgets.TEXT,
                                            ),
                                            property,
                                            1,
                                          )
                                          .then(
                                            (UpdatedSmallValueOfSecondText) => {
                                              entityExplorer.SelectEntityByName(
                                                "Text3",
                                              );
                                              agHelper
                                                .GetWidgetCSSFrAttribute(
                                                  locators._widgetInDeployed(
                                                    draggableWidgets.TEXT,
                                                  ),
                                                  property,
                                                  2,
                                                )
                                                .then(
                                                  (
                                                    UpdatedSmallValueOfThirdText,
                                                  ) => {
                                                    entityExplorer.SelectEntityByName(
                                                      "Text4",
                                                    );
                                                    agHelper
                                                      .GetWidgetCSSFrAttribute(
                                                        locators._widgetInDeployed(
                                                          draggableWidgets.TEXT,
                                                        ),
                                                        property,
                                                        3,
                                                      )
                                                      .then(
                                                        (
                                                          UpdatedSmallValueOfFourthText,
                                                        ) => {
                                                          expect(
                                                            CurrentValueOfFirstText,
                                                          ).to.equal(
                                                            UpdatedSmallValueOfFirstText,
                                                          );
                                                          expect(
                                                            CurrentValueOfSecondText,
                                                          ).to.equal(
                                                            UpdatedSmallValueOfSecondText,
                                                          );
                                                          expect(
                                                            CurrentValueOfThirdText,
                                                          ).to.equal(
                                                            UpdatedSmallValueOfThirdText,
                                                          );
                                                          expect(
                                                            CurrentValueOfFourthText,
                                                          ).to.equal(
                                                            UpdatedSmallValueOfFourthText,
                                                          );
                                                        },
                                                      );
                                                  },
                                                );
                                            },
                                          );
                                      });
                                  });
                              });
                          });
                      });
                  });
              });
          });
      });
  }
  it("1. Validate change with auto height width for text widgets", function () {
    agHelper.AddDsl("alignmentWithDynamicHeightDsl");
    validateCssProperties("height");
    validateCssProperties("left");
  });
});
