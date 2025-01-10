import { initialEntityCountForExplorerTag } from "../../../../../src/constants/WidgetConstants";
import { featureFlagIntercept } from "../../../../support/Objects/FeatureFlags";
import {
  entityExplorer,
  agHelper,
} from "../../../../support/Objects/ObjectsCore";
import { PageLeftPane } from "../../../../support/Pages/EditorNavigation";
import explorerLocators from "../../../../locators/explorerlocators.json";

const MAX_BUILDING_BLOCKS_TO_DISPLAY = initialEntityCountForExplorerTag[
  "Building Blocks"
] as number;

describe(
  "Building blocks explorer tests",
  {
    tags: [
      "@tag.IDE",
      "@tag.Widget",
      "@tag.Templates",
      "@tag.excludeForAirgap",
      "@tag.PropertyPane",
      "@tag.Git",
      "@tag.ImportExport",
      "@tag.Fork",
      "@tag.Binding",
    ],
  },
  () => {
    it("1. Building blocks tag is visible and open by default", () => {
      featureFlagIntercept({ release_drag_drop_building_blocks_enabled: true });
      agHelper
        .GetElement(`${entityExplorer._widgetTagBuildingBlocks}`)
        .each(($widgetTag) => {
          const widgetsInThisTag: string[] = [];
          agHelper
            .GetElement($widgetTag)
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
          agHelper
            .GetElement($widgetTag)
            .find(entityExplorer._widgetCardTitle)
            .each(($widgetName) => {
              const value = $widgetName.text();
              widgetsInThisTag.push(value);
            });
        });

      if (widgetsInThisTag.length > MAX_BUILDING_BLOCKS_TO_DISPLAY) {
        agHelper.AssertElementVisibility(
          entityExplorer._widgetSeeMoreButton,
          true,
        );
      }
    });

    it("3. Should not show the 'See More' button if widgets are less than 9", () => {
      featureFlagIntercept({ release_drag_drop_building_blocks_enabled: true });

      // Array to store the names of widgets found
      const widgetsInThisTag: string[] = [];

      // Find and iterate over each widget card title within the specified tag
      agHelper
        .GetElement(`${entityExplorer._widgetTagBuildingBlocks}`)
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
            agHelper.AssertElementVisibility(
              entityExplorer._widgetSeeMoreButton,
              false,
            );
          } else {
            // If 9 or more widgets, ensure the 'See More' button exists
            agHelper.AssertElementVisibility(
              entityExplorer._widgetSeeMoreButton,
              true,
            );
          }
        });
    });

    it("4. Clicking on 'See More' button should show all widgets, and 'See Less' should show max 9 widgets", () => {
      featureFlagIntercept({ release_drag_drop_building_blocks_enabled: true });

      let widgetsInThisTag: string[] = [];

      // Get all building blocks before attempting to click "See More"
      // cy.get(entityExplorer._widgetTagBuildingBlocks)
      agHelper
        .GetElement(`${entityExplorer._widgetTagBuildingBlocks}`)
        .each(($widgetTag) => {
          agHelper
            .GetElement($widgetTag)
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
            // cy.get(entityExplorer._widgetSeeMoreButton).should("not.exist");
            agHelper.AssertElementVisibility(
              entityExplorer._widgetSeeMoreButton,
              false,
            );
          } else {
            // Click the "See More" button for each widget tag
            agHelper
              .GetElement(entityExplorer._widgetTagsList)
              .each(($widgetTag) => {
                agHelper
                  .GetElement($widgetTag)
                  .find(entityExplorer._widgetSeeMoreButton)
                  .should("exist")
                  .click({ force: true });
              });
          }

          // Get all building blocks after attempting to click "See More"
          let widgetsInThisTagAfterSeeMore: string[] = [];
          // cy.get(entityExplorer._widgetTagBuildingBlocks)
          agHelper
            .GetElement(`${entityExplorer._widgetTagBuildingBlocks}`)
            .each(($widgetTag) => {
              agHelper
                .GetElement($widgetTag)
                .find(entityExplorer._widgetCardTitle)
                .each(($widgetName) => {
                  const value = $widgetName.text().trim();
                  widgetsInThisTagAfterSeeMore.push(value);
                });
            })
            .then(() => {
              // Assert that the number of widgets after potentially clicking "See More" is correct
              expect(widgetsInThisTagAfterSeeMore.length).to.be.at.least(
                widgetsInThisTag.length,
              );
            });

          // Click the same "See More" button again to simulate "See Less"
          agHelper
            .GetElement(entityExplorer._widgetTagsList)
            .each(($widgetTag) => {
              agHelper
                .GetElement($widgetTag)
                .find(entityExplorer._widgetSeeMoreButton)
                .should("exist") // Check if the button still exists (now interpreted as "See Less")
                .click({ force: true });
            });

          // Get all building blocks after clicking "See Less"
          let widgetsInThisTagAfterSeeLess: string[] = [];
          agHelper
            .GetElement(entityExplorer._widgetTagBuildingBlocks)
            .each(($widgetTag) => {
              agHelper
                .GetElement($widgetTag)
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

    it("5. Should drag and drop building block on canvas", () => {
      featureFlagIntercept({ release_drag_drop_building_blocks_enabled: true });
      // primary api call for dropping building blocks on canvas
      cy.intercept("POST", "/api/v1/applications/import/partial/block").as(
        "blockImport",
      );
      const x = 600;
      const y = 80;
      // select the first building block in the list
      const selector = ".t--widget-card-draggable-buildingblock";
      cy.get(selector).should("be.visible");
      agHelper
        .GetElement(selector)
        .first()
        .trigger("dragstart", { force: true })
        .trigger("mousemove", x, y, { force: true });

      const option = {
        eventConstructor: "MouseEvent",
        scrollBehavior: false,
      } as any;

      agHelper
        .GetElement(explorerLocators.dropHere)
        .trigger("mousemove", x, y, option)
        .trigger("mousemove", x, y, option)
        .trigger("mouseup", x, y, option);

      // check that loading skeleton is present
      let buildingBlockName: string; // get the display name of the first building block
      agHelper
        .GetElement(entityExplorer._widgetTagBuildingBlocks)
        .first()
        .then(($widgetTag) => {
          agHelper
            .GetElement($widgetTag)
            .find(entityExplorer._widgetCardTitle)
            .first()
            .then(($widgetName) => {
              buildingBlockName = $widgetName.text();
              PageLeftPane.assertPresence(
                `loading_${buildingBlockName.toLowerCase().replace(/ /g, "_")}`,
              );
            });
        });
      cy.wait("@blockImport").then(() => {
        agHelper.AssertAutoSave();
        // check that the widgets are present on the canvas
        agHelper.AssertElementVisibility('[data-testid="t--ide-list"]');
        agHelper
          .GetElement('[data-testid="t--ide-list"] .t--entity-item')
          .should("have.length.greaterThan", 0);
      });
    });
  },
);
