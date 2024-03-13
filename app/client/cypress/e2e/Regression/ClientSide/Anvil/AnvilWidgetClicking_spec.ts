import { ANVIL_EDITOR_TEST } from "../../../../support/Constants";
import {
  agHelper,
  homePage,
  assertHelper,
  anvilLayout,
  locators,
  wdsWidgets,
} from "../../../../support/Objects/ObjectsCore";
import { featureFlagIntercept } from "../../../../support/Objects/FeatureFlags";
import { WIDGET } from "../../../../locators/WidgetLocators";

describe(
  `${ANVIL_EDITOR_TEST}: validating Widget clicks in Anvil Layout Mode`,
  { tags: ["@tag.Anvil"] },
  function () {
    before(() => {
      // intercept features call for Anvil + WDS tests
      featureFlagIntercept({
        release_anvil_enabled: true,
        ab_wds_enabled: true,
      });
      // Cleanup the canvas before each test
      agHelper.SelectAllWidgets();
      agHelper.PressDelete();
    });
    it("1. Click on widget to Select Widget", () => {
      anvilLayout.DragDropAnvilWidgetNVerify(WIDGET.WDSSWITCH, 5, 20, {
        skipWidgetSearch: true,
      });
      anvilLayout.DragDropAnvilWidgetNVerify(WIDGET.WDSSWITCH, 5, 20, {
        skipWidgetSearch: true,
        dropTargetDetails: {
          name: "Zone1",
        },
      });
      anvilLayout.DragDropAnvilWidgetNVerify(WIDGET.WDSBUTTON, 5, 20, {
        skipWidgetSearch: true,
        dropTargetDetails: {
          name: "Zone1",
        },
      });
      // deselect all widgets
      agHelper.PressEscape();
      agHelper.AssertElementLength(locators._selectedWidget, 0);
      agHelper.GetNClick(locators._widgetByName("Button1"));
      agHelper.AssertElementLength(locators._selectedWidget, 1);
      agHelper.GetNClick(locators._widgetByName("Switch1"));
      agHelper.AssertElementLength(locators._selectedWidget, 1);
    });
    it("2. Ctrl + Click to select multiple widgets", () => {
      agHelper.PressEscape();
      agHelper.GetNClick(locators._widgetByName("Switch2"));
      agHelper.AssertElementLength(locators._selectedWidget, 1);
      agHelper.GetNClick(
        locators._widgetByName("Button1"),
        0,
        false,
        500,
        true,
      );
      agHelper.AssertElementLength(locators._selectedWidget, 2);
    });
    it("3. Click on widgets like Switch, Checkbox to toggle selection", () => {
      // deselect all widgets
      agHelper.PressEscape();
      agHelper
        .GetNClick(wdsWidgets._switchWidgetTargetSelector("Switch1"))
        .then(() => {
          wdsWidgets.verifySwitchWidgetState("Switch1", "checked");
        });
      agHelper
        .GetNClick(wdsWidgets._switchWidgetTargetSelector("Switch1"))
        .then(() => {
          wdsWidgets.verifySwitchWidgetState("Switch1", "unchecked");
        });
      anvilLayout.DragDropAnvilWidgetNVerify(WIDGET.WDSCHECKBOX, 5, 20, {
        skipWidgetSearch: true,
        dropTargetDetails: {
          name: "Zone1",
        },
      });
      wdsWidgets.verifyCheckboxWidgetState("Checkbox1", "checked");
      agHelper
        .GetNClick(wdsWidgets._checkboxWidgetTargetSelector("Checkbox1"))
        .then(() => {
          wdsWidgets.verifyCheckboxWidgetState("Checkbox1", "unchecked");
        });
    });
    it("4. Click on Canvas to deselect all widgets", () => {
      // Find the layout component that is the main canvas
      cy.get(".anvil-canvas > div").click();
      // Find all widgets within the main canvas
      cy.get(".anvil-canvas").within(() => {
        // For each widget check if the border-color is transparent
        // The border-color changes if a widget is selected or focused.
        cy.get(".anvil-widget-wrapper").each(($widget) => {
          cy.wrap($widget).should(
            "have.css",
            "border-color",
            "rgba(0, 0, 0, 0)",
          );
        });
      });
    });
  },
);
