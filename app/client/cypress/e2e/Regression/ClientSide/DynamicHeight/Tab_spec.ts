import {
  agHelper,
  assertHelper,
  deployMode,
  draggableWidgets,
  entityExplorer,
  locators,
  propPane,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

describe(
  "Dynamic Height Width validation for Tab widget",
  { tags: ["@tag.AutoHeight"] },
  function () {
    before(() => {
      agHelper.AddDsl("dynamicTabWidgetdsl");
    });

    function validateHeight() {
      agHelper.GetNClick(propPane._tabId1);
      agHelper
        .GetWidgetCSSHeight(locators._widgetInDeployed(draggableWidgets.TAB))
        .then((currentHeight: number) => {
          agHelper.GetNClick(propPane._tabId2);
          agHelper.Sleep(1000);
          agHelper
            .GetWidgetCSSHeight(
              locators._widgetInDeployed(draggableWidgets.TAB),
            )
            .then((updatedHeight: number) => {
              expect(currentHeight).to.not.equal(updatedHeight);
            });
        });
    }
    it("1. Tab widget validation of height with dynamic height feature with publish mode", function () {
      //changing the Text Name and verifying
      EditorNavigation.SelectEntityByName("Tabs1", EntityType.Widget);
      propPane.SelectPropertiesDropDown("height", "Auto Height");
      agHelper.GetNClick(propPane._tabId1);
      validateHeight();
      deployMode.DeployApp();
      validateHeight();
      deployMode.NavigateBacktoEditor();
      agHelper.AssertElementVisibility(locators._previewModeToggle("edit"));
      agHelper.GetNClick(locators._previewModeToggle("edit"));
      agHelper.GetNClick(propPane._tabId1);
      agHelper
        .GetWidgetCSSHeight(locators._widgetInDeployed(draggableWidgets.TAB))
        .then((currentHeight) => {
          agHelper.GetNClick(propPane._tabId2);
          agHelper.Sleep(1000);
          agHelper
            .GetWidgetCSSHeight(
              locators._widgetInDeployed(draggableWidgets.TAB),
            )
            .then((updatedHeight: number) => {
              expect(currentHeight).to.not.equal(updatedHeight);
            });
        });
      // it("Tab widget validation of height with preview mode", function() {
      agHelper.AssertElementVisibility(locators._previewModeToggle("preview"));
      agHelper.GetNClick(locators._previewModeToggle("preview"));
      EditorNavigation.SelectEntityByName("Tabs1", EntityType.Widget);
      propPane.SelectPropertiesDropDown("height", "Fixed");
      agHelper.GetNClick(propPane._tabId1);
      agHelper
        .GetWidgetCSSHeight(locators._widgetInDeployed(draggableWidgets.TAB))
        .then((currentHeight: number) => {
          agHelper.GetNClick(propPane._tabId2);
          agHelper
            .GetWidgetCSSHeight(
              locators._widgetInDeployed(draggableWidgets.TAB),
            )
            .then((updatedHeight: number) => {
              expect(currentHeight).to.equal(updatedHeight);
              agHelper.GetNClick(propPane._showTabsProperty);
              assertHelper.AssertNetworkStatus("@updateLayout", 200);
              agHelper
                .GetWidgetCSSHeight(
                  locators._widgetInDeployed(draggableWidgets.TAB),
                )
                .then((upheight: number) => {
                  expect(updatedHeight).to.equal(upheight);
                  agHelper.AssertElementAbsence(propPane._tabId1);
                  agHelper.AssertElementAbsence(propPane._tabId2);
                });
            });
        });
      //it("Tab widget validation of height with reload", function() {
      EditorNavigation.SelectEntityByName("Tabs1", EntityType.Widget);
      agHelper.AssertElementVisibility(propPane._propertyPaneHeightLabel);
      agHelper.GetNClick(propPane._showTabsProperty);
      propPane.SelectPropertiesDropDown("height", "Auto Height");
      agHelper.GetNClick(propPane._tabId1);
      agHelper
        .GetWidgetCSSHeight(locators._widgetInDeployed(draggableWidgets.TAB))
        .then((currentHeight: number) => {
          agHelper.GetNClick(propPane._tabId2);
          propPane.SelectPropertiesDropDown("height", "Fixed");
          agHelper.RefreshPage();
          EditorNavigation.SelectEntityByName("Tabs1", EntityType.Widget);
          agHelper
            .GetWidgetCSSHeight(
              locators._widgetInDeployed(draggableWidgets.TAB),
            )
            .then((updatedHeight: number) => {
              expect(currentHeight).to.not.equal(updatedHeight);
            });
        });
    });
  },
);
