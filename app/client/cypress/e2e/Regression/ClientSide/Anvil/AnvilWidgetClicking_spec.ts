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
      agHelper.GetNClick(`${anvilLayout.mainCanvasSelector}`);
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
    it("3. Click on Canvas to deselect all widgets", () => {
      // Find the layout component that is the main canvas
      cy.get(`${anvilLayout.mainCanvasSelector} > div`).click();
      // Find all widgets within the main canvas
      cy.get(`${anvilLayout.mainCanvasSelector}`).within(() => {
        // For each widget check if the border-color is transparent
        // The border-color changes if a widget is selected or focused.
        cy.get("[data-testid=t--anvil-widget-wrapper]").each(($widget) => {
          cy.wrap($widget).should(
            "have.css",
            "outline-color",
            "rgba(0, 0, 0, 0)",
          );
        });
      });
    });
  },
);
