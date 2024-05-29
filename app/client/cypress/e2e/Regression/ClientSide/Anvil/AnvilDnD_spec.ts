import { agHelper, anvilLayout } from "../../../../support/Objects/ObjectsCore";
import { ANVIL_EDITOR_TEST, modifierKey } from "../../../../support/Constants";
import { featureFlagIntercept } from "../../../../support/Objects/FeatureFlags";
import { anvilLocators } from "../../../../support/Pages/Anvil/Locators";

describe(
  `${ANVIL_EDITOR_TEST}: Anvil tests for DnD Module`,
  { tags: ["@tag.Anvil"] },
  () => {
    before(() => {
      // intercept features call for Anvil + WDS tests
      featureFlagIntercept({
        release_anvil_enabled: true,
      });
      // Cleanup the canvas before each test
      agHelper.SelectAllWidgets();
      agHelper.PressDelete();
    });
    it("1. Verify dragging and dropping a widget into an empty area to create a new section", () => {
      anvilLayout.dnd.DragDropNewAnvilWidgetNVerify(
        anvilLocators.WDSBUTTON,
        10,
        10,
        {
          skipWidgetSearch: true,
        },
      );
      // section and zone for the widget should be created
      agHelper.AssertElementLength(
        anvilLocators.anvilWidgetTypeSelector(anvilLocators.ZONE),
        1,
      );
      agHelper.AssertElementLength(
        anvilLocators.anvilWidgetTypeSelector(anvilLocators.SECTION),
        1,
      );
      anvilLayout.verifyParentChildRelationship("Zone1", "Button1");
      anvilLayout.verifyParentChildRelationship("Section1", "Zone1");
    });

    it("2. Verify dragging and dropping a widget into an existing section", () => {
      agHelper.AssertElementLength(
        anvilLocators.anvilWidgetTypeSelector(anvilLocators.ZONE),
        1,
      );
      anvilLayout.dnd.DragDropNewAnvilWidgetNVerify(
        anvilLocators.WDSBUTTON,
        10,
        10,
        {
          skipWidgetSearch: true,
          dropTargetDetails: {
            name: "Section1",
          },
        },
      );
      agHelper.AssertElementLength(
        anvilLocators.anvilWidgetTypeSelector(anvilLocators.SECTION),
        1,
      );
      // zone count has to increase
      agHelper.AssertElementLength(
        anvilLocators.anvilWidgetTypeSelector(anvilLocators.ZONE),
        2,
      );
      anvilLayout.verifyParentChildRelationship("Section1", "Zone2");
    });
    it("3. Verify dragging and dropping a widget into an existing zone", () => {
      anvilLayout.dnd.DragDropNewAnvilWidgetNVerify(
        anvilLocators.WDSBUTTON,
        10,
        10,
        {
          skipWidgetSearch: true,
          dropTargetDetails: {
            name: "Zone1",
          },
        },
      );
      agHelper.AssertElementLength(
        anvilLocators.anvilWidgetTypeSelector(anvilLocators.ZONE),
        2,
      );
      anvilLayout.verifyParentChildRelationship("Zone1", "Button3");
    });
    it("4. Verify moving a widget from one section to another", () => {
      anvilLayout.dnd.DragDropNewAnvilWidgetNVerify(
        anvilLocators.WDSBUTTON,
        50,
        360,
        {
          skipWidgetSearch: true,
        },
      );
      anvilLayout.verifyParentChildRelationship("Section2", "Zone3");
      anvilLayout.verifyParentChildRelationship("Zone3", "Button4");
      anvilLayout.dnd.MoveAnvilWidget("Button1", 10, 10, {
        dropTargetDetails: {
          name: "Section2",
        },
      });
      anvilLayout.verifyParentChildRelationship("Zone4", "Button1");
    });
    it("5. Verify moving a widget from one zone to another within the same section", () => {
      anvilLayout.verifyParentChildRelationship("Section2", "Zone4");
      anvilLayout.verifyParentChildRelationship("Zone4", "Button1");
      anvilLayout.dnd.MoveAnvilWidget("Button1", 10, 10, {
        dropTargetDetails: {
          name: "Zone3",
        },
      });
      anvilLayout.verifyParentChildRelationship("Zone3", "Button1");
      anvilLayout.verifyParentChildRelationship("Section2", "Zone3");
    });
    it("6. Verify dragging and dropping multiple widgets simultaneously", () => {
      agHelper.GetNClick(anvilLocators.anvilWidgetNameSelector("Button1"));
      agHelper.GetNClick(
        anvilLocators.anvilWidgetNameSelector("Button4"),
        0,
        false,
        500,
        true,
      );
      anvilLayout.dnd.MoveAnvilWidget("Button4", 10, 10, {
        dropTargetDetails: {
          name: "Zone4",
        },
      });
      anvilLayout.verifyParentChildRelationship("Zone4", "Button4");
      anvilLayout.verifyParentChildRelationship("Zone4", "Button1");
    });
    it("7. Verify undo/redo functionality after drag and drop", () => {
      // Undo
      cy.get("body").type(`{${modifierKey}+z}`);
      anvilLayout.verifyParentChildRelationship("Zone3", "Button4");
      anvilLayout.verifyParentChildRelationship("Zone3", "Button1");
    });
  },
);
