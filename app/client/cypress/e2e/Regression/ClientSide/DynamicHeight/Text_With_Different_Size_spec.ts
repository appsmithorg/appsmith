import {
  entityExplorer,
  agHelper,
  locators,
} from "../../../../support/Objects/ObjectsCore";

describe("Dynamic Height Width validation", function () {
  function validateCssProperties(property) {
    agHelper.GetNClick("button:contains('Small')", 0, true);
    agHelper.Sleep(3000);
    entityExplorer.SelectEntityByName("Text1");
    agHelper
      .GetWidgetCSSFrAttribute(
        locators._widgetInDeployed("textwidget"),
        property,
        0,
      )
      .then((CurrentValueOfFirstText) => {
        entityExplorer.SelectEntityByName("Text2");
        agHelper
          .GetWidgetCSSFrAttribute(
            locators._widgetInDeployed("textwidget"),
            property,
            1,
          )
          .then((CurrentValueOfSecondText) => {
            entityExplorer.SelectEntityByName("Text3");
            agHelper
              .GetWidgetCSSFrAttribute(
                locators._widgetInDeployed("textwidget"),
                property,
                2,
              )
              .then((CurrentValueOfThirdText) => {
                entityExplorer.SelectEntityByName("Text4");
                agHelper
                  .GetWidgetCSSFrAttribute(
                    locators._widgetInDeployed("textwidget"),
                    property,
                    3,
                  )
                  .then((CurrentValueOfFourthText) => {
                    agHelper.GetNClick("button:contains('Large')", 0, true);
                    entityExplorer.SelectEntityByName("Text1");
                    agHelper
                      .GetWidgetCSSFrAttribute(
                        locators._widgetInDeployed("textwidget"),
                        property,
                        0,
                      )
                      .then((UpdatedLargeValueOfFirstText) => {
                        entityExplorer.SelectEntityByName("Text2");
                        agHelper
                          .GetWidgetCSSFrAttribute(
                            locators._widgetInDeployed("textwidget"),
                            property,
                            1,
                          )
                          .then((UpdatedLargeValueOfSecondText) => {
                            entityExplorer.SelectEntityByName("Text3");
                            agHelper
                              .GetWidgetCSSFrAttribute(
                                locators._widgetInDeployed("textwidget"),
                                property,
                                2,
                              )
                              .then((UpdatedLargeValueOfThirdText) => {
                                entityExplorer.SelectEntityByName("Text4");
                                agHelper
                                  .GetWidgetCSSFrAttribute(
                                    locators._widgetInDeployed("textwidget"),
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
                                    agHelper.GetNClick(
                                      "button:contains('Small')",
                                      0,
                                      true,
                                    );
                                    agHelper.Sleep(3000);
                                    entityExplorer.SelectEntityByName("Text1");
                                    agHelper
                                      .GetWidgetCSSFrAttribute(
                                        locators._widgetInDeployed(
                                          "textwidget",
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
                                              "textwidget",
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
                                                    "textwidget",
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
                                                          "textwidget",
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
    cy.fixture("alignmentWithDynamicHeightDsl").then((val) => {
      agHelper.AddDsl(val);
    });
    validateCssProperties("height");
    validateCssProperties("left");
  });
});
