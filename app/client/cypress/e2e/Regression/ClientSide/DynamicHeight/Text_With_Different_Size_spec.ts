import {
  agHelper,
  draggableWidgets,
  locators,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

describe("Dynamic Height Width validation", function () {
  function validateCssProperties(property) {
    agHelper.GetNClickByContains("button", "Small", 0, true);
    agHelper.Sleep(2000);
    EditorNavigation.SelectEntityByName("Text1", EntityType.Widget);
    agHelper.Sleep(2000);
    agHelper
      .GetWidgetCSSFrAttribute(
        locators._widgetInDeployed(draggableWidgets.TEXT),
        property,
        0,
      )
      .then((CurrentValueOfFirstText) => {
        EditorNavigation.SelectEntityByName("Text2", EntityType.Widget);
        agHelper
          .GetWidgetCSSFrAttribute(
            locators._widgetInDeployed(draggableWidgets.TEXT),
            property,
            1,
          )
          .then((CurrentValueOfSecondText) => {
            EditorNavigation.SelectEntityByName("Text3", EntityType.Widget);
            agHelper.Sleep(2000);
            agHelper
              .GetWidgetCSSFrAttribute(
                locators._widgetInDeployed(draggableWidgets.TEXT),
                property,
                2,
              )
              .then((CurrentValueOfThirdText) => {
                EditorNavigation.SelectEntityByName("Text4", EntityType.Widget);
                agHelper.Sleep(2000);
                agHelper
                  .GetWidgetCSSFrAttribute(
                    locators._widgetInDeployed(draggableWidgets.TEXT),
                    property,
                    3,
                  )
                  .then((CurrentValueOfFourthText) => {
                    agHelper.GetNClickByContains("button", "Large", 0, true);
                    agHelper.Sleep(3000);
                    EditorNavigation.SelectEntityByName(
                      "Text1",
                      EntityType.Widget,
                    );
                    agHelper
                      .GetWidgetCSSFrAttribute(
                        locators._widgetInDeployed(draggableWidgets.TEXT),
                        property,
                        0,
                      )
                      .then((UpdatedLargeValueOfFirstText) => {
                        EditorNavigation.SelectEntityByName(
                          "Text2",
                          EntityType.Widget,
                        );
                        agHelper
                          .GetWidgetCSSFrAttribute(
                            locators._widgetInDeployed(draggableWidgets.TEXT),
                            property,
                            1,
                          )
                          .then((UpdatedLargeValueOfSecondText) => {
                            EditorNavigation.SelectEntityByName(
                              "Text3",
                              EntityType.Widget,
                            );
                            agHelper
                              .GetWidgetCSSFrAttribute(
                                locators._widgetInDeployed(
                                  draggableWidgets.TEXT,
                                ),
                                property,
                                2,
                              )
                              .then((UpdatedLargeValueOfThirdText) => {
                                EditorNavigation.SelectEntityByName(
                                  "Text4",
                                  EntityType.Widget,
                                );
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
                                    agHelper.Sleep(2000);
                                    EditorNavigation.SelectEntityByName(
                                      "Text1",
                                      EntityType.Widget,
                                    );
                                    agHelper.Sleep(2000);
                                    agHelper
                                      .GetWidgetCSSFrAttribute(
                                        locators._widgetInDeployed(
                                          draggableWidgets.TEXT,
                                        ),
                                        property,
                                        0,
                                      )
                                      .then((UpdatedSmallValueOfFirstText) => {
                                        EditorNavigation.SelectEntityByName(
                                          "Text2",
                                          EntityType.Widget,
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
                                              EditorNavigation.SelectEntityByName(
                                                "Text3",
                                                EntityType.Widget,
                                              );
                                              agHelper.Sleep(2000);
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
                                                    EditorNavigation.SelectEntityByName(
                                                      "Text4",
                                                      EntityType.Widget,
                                                    );
                                                    agHelper.Sleep(2000);
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
