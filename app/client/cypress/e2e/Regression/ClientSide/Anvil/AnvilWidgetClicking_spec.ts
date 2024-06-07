import { ANVIL_EDITOR_TEST } from "../../../../support/Constants";
import { agHelper, anvilLayout } from "../../../../support/Objects/ObjectsCore";
import { featureFlagIntercept } from "../../../../support/Objects/FeatureFlags";
import { WIDGET } from "../../../../locators/WidgetLocators";
import { anvilLocators } from "../../../../support/Pages/Anvil/Locators";

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
      anvilLayout.dnd.DragDropNewAnvilWidgetNVerify(
        anvilLocators.WDSSWITCH,
        5,
        20,
        {
          skipWidgetSearch: true,
        },
      );
      anvilLayout.dnd.DragDropNewAnvilWidgetNVerify(
        anvilLocators.WDSSWITCH,
        5,
        20,
        {
          skipWidgetSearch: true,
          dropTargetDetails: {
            name: "Zone1",
          },
        },
      );
      anvilLayout.dnd.DragDropNewAnvilWidgetNVerify(
        anvilLocators.WDSBUTTON,
        5,
        20,
        {
          skipWidgetSearch: true,
          dropTargetDetails: {
            name: "Zone1",
          },
        },
      );
      agHelper.GetNClick(`${anvilLocators.mainCanvasSelector}`);
      agHelper.AssertElementLength(anvilLocators.anvilSelectedWidget, 0);
      agHelper.GetNClick(anvilLocators.anvilWidgetNameSelector("Button1"));
      agHelper.AssertElementLength(anvilLocators.anvilSelectedWidget, 1);
      agHelper.GetNClick(anvilLocators.anvilWidgetNameSelector("Switch1"));
      agHelper.AssertElementLength(anvilLocators.anvilSelectedWidget, 1);
    });
    it("2. Ctrl + Click to select multiple widgets", () => {
      agHelper.PressEscape();
      agHelper.GetNClick(anvilLocators.anvilWidgetNameSelector("Switch2"));
      agHelper.AssertElementLength(anvilLocators.anvilSelectedWidget, 1);
      agHelper.GetNClick(
        anvilLocators.anvilWidgetNameSelector("Button1"),
        0,
        false,
        500,
        true,
      );
      agHelper.AssertElementLength(anvilLocators.anvilSelectedWidget, 2);
    });
    it("3. Click on Canvas to deselect all widgets", () => {
      // Find the layout component that is the main canvas
      cy.get(`${anvilLocators.mainCanvasSelector} > div`).click();
      // Find all widgets within the main canvas
      cy.get(`${anvilLocators.mainCanvasSelector}`).within(() => {
        // For each widget check if the border-color is transparent
        // The border-color changes if a widget is selected or focused.
        cy.get(anvilLocators.anvilWidgetSelector).each(($widget) => {
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
