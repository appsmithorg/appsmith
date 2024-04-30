import { featureFlagIntercept } from "../../../../support/Objects/FeatureFlags";
import {
  entityExplorer,
  agHelper,
} from "../../../../support/Objects/ObjectsCore";

const commonlocators = require("../../../../locators/commonlocators.json");

// Taken from here appsmith/app/client/src/constants/WidgetConstants.tsx
const MAX_BUILDING_BLOCKS_TO_DISPLAY = 9;

describe(
  "Building blocks explorer tests",
  {
    tags: ["@tag.IDE", "@tag.Widget"],
  },
  () => {
    it("1. Building blocks tag is visible and open by default", () => {
      featureFlagIntercept({ release_drag_drop_building_blocks_enabled: true });
      agHelper
        .GetElement(`${entityExplorer._widgetTagBuildingBlocks}`)
        .each(($widgetTag) => {
          const widgetsInThisTag: string[] = [];
          cy.wrap($widgetTag)
            .find(entityExplorer._widgetCardTitle)
            .each(($widgetName) => {
              const value = $widgetName.text();
              widgetsInThisTag.push(value);
            })
            .then(() => {
              expect(widgetsInThisTag).to.have.length.gt(1);
            });
        });
    });

    it("2. If widgets are more than 9, see more button should be visible", () => {
      featureFlagIntercept({ release_drag_drop_building_blocks_enabled: true });
      let widgetsInThisTag: string[] = [];

      agHelper
        .GetElement(`${entityExplorer._widgetTagBuildingBlocks}`)
        .each(($widgetTag) => {
          cy.wrap($widgetTag)
            .find(entityExplorer._widgetCardTitle)
            .each(($widgetName) => {
              const value = $widgetName.text();
              widgetsInThisTag.push(value);
            });
        });

      if (widgetsInThisTag.length > MAX_BUILDING_BLOCKS_TO_DISPLAY) {
        cy.get(entityExplorer._widgetSeeMoreButton).should("be.visible");
      }
    });

    it("3. Should not show the 'See More' button if widgets are less than 9", () => {
      featureFlagIntercept({ release_drag_drop_building_blocks_enabled: true });

      // Array to store the names of widgets found
      const widgetsInThisTag: string[] = [];

      // Find and iterate over each widget card title within the specified tag
      cy.get(entityExplorer._widgetTagBuildingBlocks)
        .find(entityExplorer._widgetCardTitle)
        .each(($widgetName) => {
          // Extract the text of each widget title
          const value = $widgetName.text().trim();
          widgetsInThisTag.push(value);
        })
        .then(() => {
          // After collecting widget names, assert based on the count
          if (widgetsInThisTag.length < MAX_BUILDING_BLOCKS_TO_DISPLAY) {
            // If less than 9 widgets, ensure the 'See More' button does not exist
            cy.get(entityExplorer._widgetSeeMoreButton).should("not.exist");
          } else {
            // If 9 or more widgets, ensure the 'See More' button exists
            cy.get(entityExplorer._widgetSeeMoreButton).should("exist");
          }
        });
    });

    it("4. Clicking on 'See More' button should show all widgets, and 'See Less' should show max 9 widgets", () => {
      featureFlagIntercept({ release_drag_drop_building_blocks_enabled: true });

      let widgetsInThisTag: string[] = [];

      // Get all building blocks before attempting to click "See More"
      cy.get(entityExplorer._widgetTagBuildingBlocks)
        .each(($widgetTag) => {
          cy.wrap($widgetTag)
            .find(entityExplorer._widgetCardTitle)
            .each(($widgetName) => {
              const value = $widgetName.text().trim();
              widgetsInThisTag.push(value);
            });
        })
        .then(() => {
          // Check if there are fewer than 9 widgets
          if (widgetsInThisTag.length < MAX_BUILDING_BLOCKS_TO_DISPLAY) {
            // No need to click "See More" if there are already fewer than 9 widgets
            cy.get(entityExplorer._widgetSeeMoreButton).should("not.exist");
          } else {
            // Click the "See More" button for each widget tag
            cy.get(entityExplorer._widgetTagsList).each(($widgetTag) => {
              cy.wrap($widgetTag)
                .find(entityExplorer._widgetSeeMoreButton)
                .should("exist")
                .click({ force: true });
            });
          }

          // Get all building blocks after attempting to click "See More"
          let widgetsInThisTagAfterSeeMore: string[] = [];
          cy.get(entityExplorer._widgetTagBuildingBlocks)
            .each(($widgetTag) => {
              cy.wrap($widgetTag)
                .find(entityExplorer._widgetCardTitle)
                .each(($widgetName) => {
                  const value = $widgetName.text().trim();
                  widgetsInThisTagAfterSeeMore.push(value);
                });
            })
            .then(() => {
              // Assert that the number of widgets after potentially clicking "See More" is correct
              expect(widgetsInThisTagAfterSeeMore.length).to.be.greaterThan(
                widgetsInThisTag.length,
              );
            });

          // Click the same "See More" button again to simulate "See Less"
          cy.get(entityExplorer._widgetTagsList).each(($widgetTag) => {
            cy.wrap($widgetTag)
              .find(entityExplorer._widgetSeeMoreButton)
              .should("exist") // Check if the button still exists (now interpreted as "See Less")
              .click({ force: true });
          });

          // Get all building blocks after clicking "See Less"
          let widgetsInThisTagAfterSeeLess: string[] = [];
          cy.get(entityExplorer._widgetTagBuildingBlocks)
            .each(($widgetTag) => {
              cy.wrap($widgetTag)
                .find(entityExplorer._widgetCardTitle)
                .each(($widgetName) => {
                  const value = $widgetName.text().trim();
                  widgetsInThisTagAfterSeeLess.push(value);
                });
            })
            .then(() => {
              // Assert that the number of widgets after clicking "See Less" is back to original count
              expect(widgetsInThisTagAfterSeeLess.length).to.equal(
                widgetsInThisTag.length,
              );
            });
        });
    });

    it.only("5. Should drop widget on canvas", () => {
      featureFlagIntercept({ release_drag_drop_building_blocks_enabled: true });
      cy.get(commonlocators.entityExplorersearch).should("be.visible");
      cy.get(commonlocators.entityExplorersearch).clear().type("form");
      cy.dragAndDropToCanvas("buildingblock", { x: 10, y: 10 });
    });
  },
);
