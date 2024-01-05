import {
  agHelper,
  draggableWidgets,
  locators,
  pageSettings,
  propPane,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

describe(
  "Dynamic Height Width validation",
  { tags: ["@tag.AutoHeight"] },
  function () {
    it("1. Validate change with auto height width for Form/Switch", function () {
      agHelper.AddDsl("dynamicHeightFormSwitchdsl");

      EditorNavigation.SelectEntityByName("Form1", EntityType.Widget);
      agHelper
        .GetWidgetCSSHeight(locators._widgetInDeployed(draggableWidgets.FORM))
        .then((formheight) => {
          propPane.SelectPropertiesDropDown("height", "Auto Height");
          EditorNavigation.SelectEntityByName(
            "SwitchGroup1",
            EntityType.Widget,
            {},
            ["Form1"],
          );
          propPane.SelectPropertiesDropDown("height", "Auto Height");
          agHelper
            .GetWidgetCSSHeight(
              locators._widgetInDeployed(draggableWidgets.SWITCHGROUP),
            )
            .then((CurrentSwitchHeight) => {
              agHelper
                .GetWidgetCSSHeight(
                  locators._widgetInDeployed(draggableWidgets.FORM),
                )
                .then((CurrentFormHeight) => {
                  agHelper.UpdateCodeInput(
                    locators._controlOption,
                    `[
                      {"label": "Blue","value": "BLUE"},
                      { "label": "Green","value": "GREEN"},
                      {"label": "Red","value": "RED"},
                      { "label": "Yellow","value": "YELLOW"},
                      {"label": "Purple","value": "PURPLE"},
                      {"label": "Pink","value": "PINK"},
                      {"label": "Black","value": "BLACK"},
                      {"label": "Grey","value": "GREY"},
                      {"label": "Orange","value": "ORANGE"},
                      {"label": "Cream","value": "CREAM"}
                    ]`,
                  );
                  agHelper.Sleep(3000);
                  agHelper
                    .GetWidgetCSSHeight(
                      locators._widgetInDeployed(draggableWidgets.SWITCHGROUP),
                    )
                    .then((UpdatedSwitchHeight: number) => {
                      agHelper
                        .GetWidgetCSSHeight(
                          locators._widgetInDeployed(draggableWidgets.FORM),
                        )
                        .then((UpdatedFormHeight: number) => {
                          expect(CurrentFormHeight).to.not.equal(
                            UpdatedFormHeight,
                          );
                          expect(CurrentSwitchHeight).to.not.equal(
                            UpdatedSwitchHeight,
                          );
                        });
                    });
                });
            });
        });
      agHelper.GetNClick(
        `${locators._widgetInDeployed(draggableWidgets.SWITCHGROUP)} ${
          pageSettings.locators._setHomePageToggle
        }`,
      );
      agHelper.AssertElementLength(locators._modal, 1);
      //propPane.TogglePropertyState("Switch","On");
      EditorNavigation.SelectEntityByName("Modal1", EntityType.Widget);
      propPane.SelectPropertiesDropDown("height", "Auto Height");
      agHelper.GetNClick(locators._closeModal, 0, true);
    });
  },
);
