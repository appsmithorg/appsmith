import {
  agHelper,
  anvilLayout,
  propPane,
} from "../../../../support/Objects/ObjectsCore";
import { ANVIL_EDITOR_TEST } from "../../../../support/Constants";
import { featureFlagIntercept } from "../../../../support/Objects/FeatureFlags";
import { anvilLocators } from "../../../../support/Pages/Anvil/Locators";

describe(
  `${ANVIL_EDITOR_TEST}: Anvil tests for Sections and Zones`,
  { tags: ["@tag.Anvil"] },
  () => {
    before(() => {
      // intercept features call for Anvil + WDS tests
      featureFlagIntercept({
        release_anvil_enabled: true,
      });
    });
    beforeEach(() => {
      // Cleanup the canvas before each test
      agHelper.PressEscape();
      agHelper.SelectAllWidgets();
      agHelper.PressDelete();
    });
    it("1. Verify removing a zone by dragging a zone out of a section", () => {
      // create a new section with a Zone widget
      anvilLayout.dnd.DragDropNewAnvilWidgetNVerify(
        anvilLocators.ZONE,
        10,
        10,
        {
          skipWidgetSearch: true,
        },
      );
      // create a new zone within the section
      anvilLayout.dnd.DragDropNewAnvilWidgetNVerify(
        anvilLocators.ZONE,
        10,
        10,
        {
          skipWidgetSearch: true,
          dropTargetDetails: {
            name: "Section1",
          },
        },
      );
      anvilLayout.verifyParentChildRelationship("Section1", "Zone2");
      anvilLayout.sections.verifyZoneCount("Section1", 2);
      // move zone out of section to main canvas
      anvilLayout.dnd.MoveAnvilWidget("Zone2", 10, 10);
      anvilLayout.sections.verifyZoneCount("Section1", 1);
      anvilLayout.sections.verifySectionDistribution("Section1", [12]);
      anvilLayout.sections.verifyZoneCount("Section2", 1);
      anvilLayout.sections.verifySectionDistribution("Section2", [12]);
      anvilLayout.verifyParentChildRelationship("Section2", "Zone2");
    });
    it("2. Verify removing a section by dragging all zones out of the section", () => {
      // create a new section with a Zone widget
      anvilLayout.dnd.DragDropNewAnvilWidgetNVerify(
        anvilLocators.ZONE,
        10,
        10,
        {
          skipWidgetSearch: true,
        },
      );
      // create another new section by dropping a zone
      anvilLayout.dnd.DragDropNewAnvilWidgetNVerify(
        anvilLocators.ZONE,
        10,
        10,
        {
          skipWidgetSearch: true,
        },
      );
      anvilLayout.dnd.MoveAnvilWidget("Zone1", 10, 10, {
        dropTargetDetails: {
          name: "Section2",
        },
      });
      anvilLayout.verifyWidgetDoesNotExist("Section1");
      anvilLayout.sections.verifyZoneCount("Section2", 2);
    });

    it("3. Verify removing a section through the property pane of a section", () => {
      // create a new section with a Zone widget
      anvilLayout.dnd.DragDropNewAnvilWidgetNVerify(
        anvilLocators.ZONE,
        10,
        10,
        {
          skipWidgetSearch: true,
        },
      );
      // delete the section via the property pane
      propPane.DeleteWidgetFromPropertyPane("Section1");
      anvilLayout.verifyWidgetDoesNotExist("Section1");
    });
  },
);
