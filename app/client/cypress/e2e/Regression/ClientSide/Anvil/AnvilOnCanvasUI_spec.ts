import { ANVIL_EDITOR_TEST } from "../../../../support/Constants";
import { agHelper, anvilLayout } from "../../../../support/Objects/ObjectsCore";
import { featureFlagIntercept } from "../../../../support/Objects/FeatureFlags";
import { WIDGET } from "../../../../locators/WidgetLocators";
import { anvilLocators } from "../../../../support/Pages/Anvil/Locators";

describe(
  `${ANVIL_EDITOR_TEST}: Testing On Canvas UI in Anvil Layout Mode`,
  { tags: ["@tag.Anvil"] },
  function () {
    before(() => {
      // intercept features call for Anvil + WDS tests
      featureFlagIntercept({
        release_anvil_enabled: true,
      });
    });
    it("1. Widget name component shows and positioned correctly", () => {
      const horizontalPixelOnCanvasMouseMovement = 5;
      let verticalPixelOnCanvasMouseMovement = 20;
      // Dnd Button widget into the existing zone
      anvilLayout.dnd.DragDropNewAnvilWidgetNVerify(
        anvilLocators.WDSBUTTON,
        horizontalPixelOnCanvasMouseMovement,
        verticalPixelOnCanvasMouseMovement,
        {
          skipWidgetSearch: true,
        },
      );
      // Unselect all widgets by clicking on the canvas
      agHelper.GetNClick(`${anvilLocators.mainCanvasSelector}`);

      // hover over button widget
      agHelper.HoverElement(anvilLocators.anvilWidgetNameSelector("Button1"));
      // Make sure there is one widget name showing on the canvas
      agHelper.AssertElementLength(
        anvilLocators.anvilOnCanvasWidgetNameSelector,
        1,
      );

      // Make sure the widget name is positioned above the widget
      cy.get(anvilLocators.anvilWidgetNameSelector("Button1")).then(($el) => {
        const el = $el[0];
        const buttonRect = el.getBoundingClientRect();
        cy.get(anvilLocators.anvilOnCanvasWidgetNameSelector).then(
          ($onCanvasEL) => {
            const el = $onCanvasEL[0];
            const widgetNameRect = el.getBoundingClientRect();
            expect(buttonRect.top).to.equal(widgetNameRect.bottom);
          },
        );
      });
      verticalPixelOnCanvasMouseMovement = 200;
      // Dnd Button widget into the existing zone
      anvilLayout.dnd.DragDropNewAnvilWidgetNVerify(
        anvilLocators.WDSBUTTON,
        horizontalPixelOnCanvasMouseMovement,
        verticalPixelOnCanvasMouseMovement,
        {
          skipWidgetSearch: true,
        },
      );
      // Click on the button widget
      agHelper.GetNClick(anvilLocators.anvilWidgetNameSelector("Button1"));
      // Make sure there is one widget name showing on the canvas
      agHelper.AssertElementLength(
        anvilLocators.anvilOnCanvasWidgetNameSelector,
        1,
      );
      // Make sure the widget name is positioned above the widget
      cy.get(anvilLocators.anvilWidgetNameSelector("Button1")).then(($el) => {
        const el = $el[0];
        const buttonRect = el.getBoundingClientRect();
        cy.get(anvilLocators.anvilOnCanvasWidgetNameSelector).then(
          ($onCanvasEL) => {
            const el = $onCanvasEL[0];
            const widgetNameRect = el.getBoundingClientRect();
            expect(buttonRect.top).to.equal(widgetNameRect.bottom);
          },
        );
      });

      // Move the widget and check that the widget has moved into a new zone
      anvilLayout.dnd.MoveAnvilWidget(undefined, 0, 80);
      agHelper.AssertAutoSave();
      anvilLayout.verifyParentChildRelationship("Zone2", "Button1");
    });
    it("2. Multiple widget names should show when multiple widgets are selected", () => {
      // Cleanup the canvas before test
      agHelper.PressEscape();
      agHelper.SelectAllWidgets();
      agHelper.PressDelete();
      const horizontalPixelOnCanvasMouseMovement = 5;
      const verticalPixelOnCanvasMouseMovement = 20;
      // DnD Switch widget
      anvilLayout.dnd.DragDropNewAnvilWidgetNVerify(
        anvilLocators.WDSSWITCH,
        horizontalPixelOnCanvasMouseMovement,
        verticalPixelOnCanvasMouseMovement,
        {
          skipWidgetSearch: true,
        },
      );

      // DnD Switch widget into the existing zone
      anvilLayout.dnd.DragDropNewAnvilWidgetNVerify(
        anvilLocators.WDSSWITCH,
        horizontalPixelOnCanvasMouseMovement,
        verticalPixelOnCanvasMouseMovement,
        {
          skipWidgetSearch: true,
          dropTargetDetails: {
            name: "Zone1",
          },
        },
      );
      // Dnd Button widget into the existing zone
      anvilLayout.dnd.DragDropNewAnvilWidgetNVerify(
        anvilLocators.WDSBUTTON,
        horizontalPixelOnCanvasMouseMovement,
        verticalPixelOnCanvasMouseMovement,
        {
          skipWidgetSearch: true,
          dropTargetDetails: {
            name: "Zone1",
          },
        },
      );
      // Select an existing switch widget
      agHelper.GetNClick(
        anvilLocators.anvilWidgetNameSelector("Switch1"),
        0,
        false,
        500,
        true,
      );
      // Make sure there are two widget names showing on the canvas
      agHelper.AssertElementLength(
        anvilLocators.anvilOnCanvasWidgetNameSelector,
        2,
      );
    });
  },
);
