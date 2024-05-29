import { agHelper, anvilLayout } from "../../../../support/Objects/ObjectsCore";
import { ANVIL_EDITOR_TEST } from "../../../../support/Constants";
import { featureFlagIntercept } from "../../../../support/Objects/FeatureFlags";
import { anvilLocators } from "../../../../support/Pages/Anvil/Locators";

describe(
  `${ANVIL_EDITOR_TEST}: Anvil tests for Space Distribution Module`,
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
    it("1. Verify space distribution for a single widget", () => {
      // create a new section with a button widget
      anvilLayout.dnd.DragDropNewAnvilWidgetNVerify(
        anvilLocators.WDSBUTTON,
        10,
        10,
        {
          skipWidgetSearch: true,
        },
      );
      anvilLayout.sections.incrementZones("Section1");
      anvilLayout.sections.verifyZoneCount("Section1", 2);
    });
  },
);
