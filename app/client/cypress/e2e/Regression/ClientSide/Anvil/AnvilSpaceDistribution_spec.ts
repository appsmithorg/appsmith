import {
  agHelper,
  anvilLayout,
  propPane,
} from "../../../../support/Objects/ObjectsCore";
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
    });
    beforeEach(() => {
      // Cleanup the canvas before each test
      agHelper.PressEscape();
      agHelper.SelectAllWidgets();
      agHelper.PressDelete();
    });
    it("1. Verify even space distribution when adding a new zone within an existing zone by dnd", () => {
      // create a new section with a button widget
      anvilLayout.dnd.DragDropNewAnvilWidgetNVerify(
        anvilLocators.WDSBUTTON,
        10,
        10,
        {
          skipWidgetSearch: true,
        },
      );
      anvilLayout.sections.verifyZoneCount("Section1", 1);
      anvilLayout.sections.verifySectionDistribution("Section1", [12]);
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
      anvilLayout.sections.verifyZoneCount("Section1", 2);
      anvilLayout.sections.verifySectionDistribution("Section1", [6, 6]);
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
      anvilLayout.sections.verifyZoneCount("Section1", 3);
      anvilLayout.sections.verifySectionDistribution("Section1", [4, 4, 4]);
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
      anvilLayout.sections.verifyZoneCount("Section1", 4);
      anvilLayout.sections.verifySectionDistribution("Section1", [3, 3, 3, 3]);
    });
    it("2. Verify even space distribution when adding new zone through the property pane of a section", () => {
      // create a new section with a button widget
      anvilLayout.dnd.DragDropNewAnvilWidgetNVerify(
        anvilLocators.WDSBUTTON,
        10,
        10,
        {
          skipWidgetSearch: true,
        },
      );
      anvilLayout.sections.verifyZoneCount("Section1", 1);
      anvilLayout.sections.verifySectionDistribution("Section1", [12]);
      // increment zones through the property pane resulting in two even zones
      anvilLayout.sections.incrementZones("Section1");
      anvilLayout.sections.verifyZoneCount("Section1", 2);
      anvilLayout.sections.verifySectionDistribution("Section1", [6, 6]);
      // increment zones through the property pane resulting in three even zones
      anvilLayout.sections.incrementZones("Section1");
      anvilLayout.sections.verifyZoneCount("Section1", 3);
      anvilLayout.sections.verifySectionDistribution("Section1", [4, 4, 4]);
      // increment zones through the property pane resulting in four even zones
      anvilLayout.sections.incrementZones("Section1");
      anvilLayout.sections.verifyZoneCount("Section1", 4);
      anvilLayout.sections.verifySectionDistribution("Section1", [3, 3, 3, 3]);
      // increment zones through the property pane should not increase further
      anvilLayout.sections.incrementZones("Section1");
      anvilLayout.sections.verifyZoneCount("Section1", 4);
      anvilLayout.sections.verifySectionDistribution("Section1", [3, 3, 3, 3]);
      // decrement zones through the property pane should result in three even zones
      anvilLayout.sections.decrementZones("Section1");
      anvilLayout.sections.verifyZoneCount("Section1", 3);
      anvilLayout.sections.verifySectionDistribution("Section1", [4, 4, 4]);
      // decrement zones through the property pane should result in two even zones
      anvilLayout.sections.decrementZones("Section1");
      anvilLayout.sections.verifyZoneCount("Section1", 2);
      anvilLayout.sections.verifySectionDistribution("Section1", [6, 6]);
      // decrement zones through the property pane should result in one zone
      anvilLayout.sections.decrementZones("Section1");
      anvilLayout.sections.verifyZoneCount("Section1", 1);
      anvilLayout.sections.verifySectionDistribution("Section1", [12]);
      // decrement zones through the property pane should not decrease further
      anvilLayout.sections.decrementZones("Section1");
      anvilLayout.sections.verifyZoneCount("Section1", 1);
      anvilLayout.sections.verifySectionDistribution("Section1", [12]);
    });
    it("3. Verify manual adjustment of zone space through canvas handles", () => {
      // create a section using a zone
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
      anvilLayout.sections.verifyZoneCount("Section1", 2);
      anvilLayout.sections.verifySectionDistribution("Section1", [6, 6]);
      // move distribution handle to adjust space between zones
      anvilLayout.sections.moveDistributionHandle("left", "Section1", 1, 3);
      anvilLayout.sections.verifySectionDistribution("Section1", [3, 9]);
      // move distribution handle to adjust space between zones
      anvilLayout.sections.moveDistributionHandle("right", "Section1", 1, 7);
      anvilLayout.sections.verifySectionDistribution("Section1", [10, 2]);
    });
    it("4. Verify visual check for background less zones and resize indicators", () => {
      // create a new section with a button widget
      anvilLayout.dnd.DragDropNewAnvilWidgetNVerify(
        anvilLocators.WDSBUTTON,
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

      const zone1Selector = anvilLocators.anvilWidgetNameSelector("Zone1");
      const section1Selector =
        anvilLocators.anvilWidgetNameSelector("Section1");

      anvilLayout.sections.mouseDownSpaceDistributionHandle("Section1", 1);
      // outline color of zone while distributing space should be transparent
      cy.get(zone1Selector).should(
        "have.css",
        "outline-color",
        "rgba(0, 0, 0, 0)",
      );
      // outline color of section while distributing space should not be transparent
      cy.get(section1Selector).should(
        "not.have.css",
        "outline-color",
        "transparent",
      );
    });
  },
);
