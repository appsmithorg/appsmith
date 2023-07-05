import {
  entityExplorer,
  agHelper,
  locators,
  deployMode,
  propPane,
  assertHelper,
  draggableWidgets,
} from "../../../../support/Objects/ObjectsCore";

describe("Dynamic Height Width validation for Tab widget", function () {
  before(() => {
    agHelper.AddDsl("dynamicTabWidgetdsl");
  });

  function validateHeight() {
    agHelper.GetNClick(propPane._tabId1);
    agHelper
      .GetWidgetCSSHeight(locators._widgetInDeployed(draggableWidgets.TAB))
      .then((currentHeight: number) => {
        agHelper.GetNClick(propPane._tabId2);
        agHelper
          .GetWidgetCSSHeight(locators._widgetInDeployed(draggableWidgets.TAB))
          .then((updatedHeight: number) => {
            expect(currentHeight).to.not.equal(updatedHeight);
          });
      });
  }
  it("1. Tab widget validation of height with dynamic height feature with publish mode", function () {
    //changing the Text Name and verifying
    entityExplorer.SelectEntityByName("Tabs1");
    propPane.SelectPropertiesDropDown("height", "Auto Height");
    agHelper.GetNClick(propPane._tabId1);
    validateHeight();
    deployMode.DeployApp();
    validateHeight();
    deployMode.NavigateBacktoEditor();
    agHelper.AssertElementVisible(locators._previewModeToggle("edit"));
    agHelper.GetNClick(locators._previewModeToggle("edit"));
    agHelper.GetNClick(propPane._tabId1);
    agHelper
      .GetWidgetCSSHeight(locators._widgetInDeployed(draggableWidgets.TAB))
      .then((currentHeight) => {
        agHelper.GetNClick(propPane._tabId2);
        agHelper
          .GetWidgetCSSHeight(locators._widgetInDeployed(draggableWidgets.TAB))
          .then((updatedHeight: number) => {
            expect(currentHeight).to.not.equal(updatedHeight);
          });
      });
    // it("Tab widget validation of height with preview mode", function() {
    agHelper.AssertElementVisible(locators._previewModeToggle("preview"));
    agHelper.GetNClick(locators._previewModeToggle("preview"));
    entityExplorer.SelectEntityByName("Tabs1");
    propPane.SelectPropertiesDropDown("height", "Fixed");
    agHelper.GetNClick(propPane._tabId1);
    agHelper
      .GetWidgetCSSHeight(locators._widgetInDeployed(draggableWidgets.TAB))
      .then((currentHeight: number) => {
        agHelper.GetNClick(propPane._tabId2);
        agHelper
          .GetWidgetCSSHeight(locators._widgetInDeployed(draggableWidgets.TAB))
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
    entityExplorer.SelectEntityByName("Tabs1");
    agHelper.AssertElementVisible(propPane._propertyPaneHeightLabel);
    agHelper.GetNClick(propPane._showTabsProperty);
    propPane.SelectPropertiesDropDown("height", "Auto Height");
    agHelper.GetNClick(propPane._tabId1);
    agHelper
      .GetWidgetCSSHeight(locators._widgetInDeployed(draggableWidgets.TAB))
      .then((currentHeight: number) => {
        agHelper.GetNClick(propPane._tabId2);
        propPane.SelectPropertiesDropDown("height", "Fixed");
        agHelper.RefreshPage();
        entityExplorer.SelectEntityByName("Tabs1");
        agHelper
          .GetWidgetCSSHeight(locators._widgetInDeployed(draggableWidgets.TAB))
          .then((updatedHeight: number) => {
            expect(currentHeight).to.not.equal(updatedHeight);
          });
      });
  });
});
