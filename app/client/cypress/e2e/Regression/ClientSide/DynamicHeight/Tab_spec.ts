import {
  entityExplorer,
  agHelper,
  locators,
  deployMode,
  propPane,
  assertHelper,
} from "../../../../support/Objects/ObjectsCore";

describe("Dynamic Height Width validation for Tab widget", function () {
  before(() => {
    cy.fixture("dynamicTabWidgetdsl").then((val) => {
      agHelper.AddDsl(val);
    });
  });

  function validateHeight() {
    agHelper.Sleep(2000);
    agHelper.GetNClick(locators._tabId1);
    agHelper.Sleep(2000);
    agHelper
      .GetWidgetCSSHeight(locators._widgetInDeployed("tabswidget"))
      .then((currentHeight: number) => {
        agHelper.GetNClick(locators._tabId2);
        agHelper.Sleep(2000);
        agHelper
          .GetWidgetCSSHeight(locators._widgetInDeployed("tabswidget"))
          .then((updatedHeight: number) => {
            expect(currentHeight).to.not.equal(updatedHeight);
          });
      });
  }
  it("1. Tab widget validation of height with dynamic height feature with publish mode", function () {
    //changing the Text Name and verifying
    agHelper.Sleep(3000);
    entityExplorer.SelectEntityByName("Tabs1");
    propPane.SelectPropertiesDropDown("height", "Auto Height");
    agHelper.GetNClick(locators._tabId1);
    validateHeight();
    deployMode.DeployApp();
    validateHeight();
    deployMode.NavigateBacktoEditor();
    agHelper.AssertElementVisible(locators._previewModeToggle("edit"));
    agHelper.GetNClick(locators._previewModeToggle("edit"));
    agHelper.Sleep(2000);
    agHelper.GetNClick(locators._tabId1);
    agHelper.Sleep(2000);
    agHelper
      .GetWidgetCSSHeight(locators._widgetInDeployed("tabswidget"))
      .then((currentHeight) => {
        agHelper.GetNClick(locators._tabId2);
        agHelper.Sleep(1000);
        agHelper
          .GetWidgetCSSHeight(locators._widgetInDeployed("tabswidget"))
          .then((updatedHeight: number) => {
            expect(currentHeight).to.not.equal(updatedHeight);
          });
      });
    // it("Tab widget validation of height with preview mode", function() {
    agHelper.AssertElementVisible(locators._previewModeToggle("preview"));
    agHelper.GetNClick(locators._previewModeToggle("preview"));
    agHelper.Sleep(2000);
    entityExplorer.SelectEntityByName("Tabs1");
    propPane.SelectPropertiesDropDown("height", "Fixed");
    agHelper.GetNClick(locators._tabId1);
    agHelper.Sleep(2000);
    agHelper
      .GetWidgetCSSHeight(locators._widgetInDeployed("tabswidget"))
      .then((currentHeight: number) => {
        agHelper.GetNClick(locators._tabId2);
        agHelper.Sleep(2000);
        agHelper
          .GetWidgetCSSHeight(locators._widgetInDeployed("tabswidget"))
          .then((updatedHeight: number) => {
            expect(currentHeight).to.equal(updatedHeight);
            agHelper.GetNClick(locators._showTabsProperty);
            assertHelper.AssertNetworkStatus("@updateLayout");
            agHelper
              .GetWidgetCSSHeight(locators._widgetInDeployed("tabswidget"))
              .then((upheight: number) => {
                expect(updatedHeight).to.equal(upheight);
                agHelper.AssertElementAbsence(locators._tabId1);
                agHelper.AssertElementAbsence(locators._tabId2);
              });
          });
      });
    //it("Tab widget validation of height with reload", function() {
    agHelper.Sleep(2000);
    entityExplorer.SelectEntityByName("Tabs1");
    agHelper.AssertElementVisible(locators._propertyPaneHeightLabel);
    agHelper.GetNClick(locators._showTabsProperty);
    propPane.SelectPropertiesDropDown("height", "Auto Height");
    agHelper.Sleep(2000);
    agHelper.GetNClick(locators._tabId1);
    agHelper.Sleep(2000);
    agHelper
      .GetWidgetCSSHeight(locators._widgetInDeployed("tabswidget"))
      .then((currentHeight: number) => {
        agHelper.GetNClick(locators._tabId2);
        propPane.SelectPropertiesDropDown("height", "Fixed");
        agHelper.Sleep(2000);
        agHelper.RefreshPage();
        entityExplorer.SelectEntityByName("Tabs1");
        agHelper
          .GetWidgetCSSHeight(locators._widgetInDeployed("tabswidget"))
          .then((updatedHeight: number) => {
            expect(currentHeight).to.not.equal(updatedHeight);
          });
      });
  });
});
