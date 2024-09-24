import {
  agHelper,
  entityExplorer,
  locators,
} from "../../../../support/Objects/ObjectsCore";

describe(
  "Entity explorer tests related to widgets and validation",
  { tags: ["@tag.IDE", "@tag.Widget"] },
  function () {
    // Taken from here appsmith/app/client/src/constants/WidgetConstants.tsx
    const WIDGET_TAGS: Record<string, string> = {
      SUGGESTED_WIDGETS: "Suggested",
      INPUTS: "Inputs",
      BUTTONS: "Buttons",
      SELECT: "Select",
      DISPLAY: "Display",
      LAYOUT: "Layout",
      MEDIA: "Media",
      TOGGLES: "Toggles",
      SLIDERS: "Sliders",
      CONTENT: "Content",
      EXTERNAL: "External",
    };

    // Taken from here appsmith/app/client/src/constants/WidgetConstants.tsx
    const SUGGESTED_WIDGETS_ORDER: Record<string, number> = {
      TABLE_WIDGET_V2: 1,
      INPUT_WIDGET_V2: 2,
      TEXT_WIDGET: 3,
      SELECT_WIDGET: 4,
    };

    // When adding a new widget or tag, we need to manually add it to this list.
    const WIDGETS_CATALOG: Record<string, string[]> = {
      Suggested: ["Input", "Select", "Table", "Text"],
      Inputs: [
        "Currency Input",
        "DatePicker",
        "FilePicker",
        "Input",
        "Phone Input",
        "Rich Text Editor",
      ],
      Buttons: ["Button", "Button Group", "Icon button", "Menu button"],
      Select: ["Multi TreeSelect", "MultiSelect", "Select", "TreeSelect"],
      Display: [
        "Chart",
        "Custom",
        "Iframe",
        "List",
        "Map Chart",
        "Stats Box",
        "Table",
      ],
      Layout: ["Container", "Divider", "Form", "JSON Form", "Modal", "Tabs"],
      Media: ["Audio", "Document Viewer", "Image", "Video"],
      Toggles: [
        "Checkbox",
        "Checkbox Group",
        "Radio Group",
        "Switch",
        "Switch Group",
      ],
      Sliders: ["Category Slider", "Number Slider", "Range Slider"],
      Content: ["Map", "Progress", "Rating", "Text"],
      External: ["Audio Recorder", "Camera", "Code Scanner"],
    };

    if (Cypress.env("AIRGAPPED")) {
      // Remove map and custom widget in case of airgap
      WIDGETS_CATALOG.Content = WIDGETS_CATALOG.Content.filter(
        (widget) => widget !== "Map",
      );
      WIDGETS_CATALOG.Display = WIDGETS_CATALOG.Display.filter(
        (widget) => widget !== "Custom",
      );
    }

    const getTotalNumberOfWidgets = () => {
      return Object.values(WIDGETS_CATALOG).reduce(
        (totalLength, widgets) => totalLength + widgets.length,
        0,
      );
    };

    it("1. All widget tags should be visible and open by default.", () => {
      agHelper.AssertElementLength(
        entityExplorer._widgetTagsList,
        Object.keys(WIDGET_TAGS).length,
      );

      agHelper.GetElement(entityExplorer._widgetTagsList).each(($widgetTag) => {
        cy.wrap($widgetTag)
          .find(locators._adsV2Content)
          .should("have.css", "display", "flex");
      });
    });

    it("2. All widgets should be present within their tags and these tags should be collapsible", () => {
      agHelper.GetElement(entityExplorer._widgetTagsList).each(($widgetTag) => {
        // check that tags are collapsible
        cy.wrap($widgetTag).find(locators._adsV2CollapsibleHeader).click({
          force: true,
        });
        cy.wrap($widgetTag)
          .find(locators._adsV2Content)
          .should("have.css", "display", "none");
        cy.wrap($widgetTag).find(locators._adsV2CollapsibleHeader).click({
          force: true,
        });

        // check that all widgets are present within their tags
        const widgetsInThisTag: string[] = [];

        // click the see more button for building blocks first to show all widgets
        cy.wrap($widgetTag)
          .find(entityExplorer._widgetSeeMoreButton)
          .click({ force: true });

        cy.wrap($widgetTag)
          .find(entityExplorer._widgetCardTitle)
          .each(($widgetName) => {
            const value = $widgetName.text();

            widgetsInThisTag.push(value);
          })
          .then(() => {
            cy.wrap($widgetTag)
              .find(
                `${locators._adsV2CollapsibleHeader} span${locators._adsV2Text}`,
              )
              .then(($widgetTagTitle) => {
                const expectedWidgetsInThisTag =
                  WIDGETS_CATALOG[$widgetTagTitle.text()].sort();
                widgetsInThisTag.sort();

                expect(widgetsInThisTag).to.deep.eq(expectedWidgetsInThisTag);
              });
          });
      });
    });

    it("3. All widgets other than building blocks should be ordered alphabetically within their tags, except Essential widgets, which should be sorted by their static rank.", () => {
      agHelper
        .GetElement(
          `${entityExplorer._widgetTagsList}:not(${entityExplorer._widgetTagSuggestedWidgets}):not(${entityExplorer._widgetTagBuildingBlocks})`,
        )
        .each(($widgetTag) => {
          const widgetsInThisTag: string[] = [];

          cy.wrap($widgetTag)
            .find(entityExplorer._widgetCardTitle)
            .each(($widgetName) => {
              const value = $widgetName.text();

              widgetsInThisTag.push(value);
            })
            .then(() => {
              const sortedWidgetsInThisTag = [...widgetsInThisTag].sort();

              expect(widgetsInThisTag).to.deep.eq(sortedWidgetsInThisTag);
            });
        });

      const widgetsInEssentialWidgetsTag: string[] = [];
      agHelper
        .GetElement(
          `${entityExplorer._widgetTagsList}${entityExplorer._widgetTagSuggestedWidgets}`,
        )
        .find(entityExplorer._widgetCardTitle)
        .each(($widgetName) => {
          const value = $widgetName.text();

          widgetsInEssentialWidgetsTag.push(value);
        })
        .then(() => {
          const sortedWidgetsInEssentialWidgetsTag = [
            ...widgetsInEssentialWidgetsTag,
          ].sort(
            (a, b) => SUGGESTED_WIDGETS_ORDER[a] - SUGGESTED_WIDGETS_ORDER[b],
          );

          expect(widgetsInEssentialWidgetsTag).to.deep.eq(
            sortedWidgetsInEssentialWidgetsTag,
          );
        });
    });

    it("4. Widget search should work", () => {
      agHelper.TypeText(entityExplorer._widgetSearchInput, "text");
      agHelper.AssertElementLength(entityExplorer._widgetCards, 3);

      agHelper.TypeText(entityExplorer._widgetSearchInput, "p");
      agHelper.AssertElementLength(entityExplorer._widgetCards, 2);

      agHelper.ClearNType(entityExplorer._widgetSearchInput, "cypress");
      if (Cypress.env("AIRGAPPED")) {
        agHelper.AssertElementLength(entityExplorer._widgetCards, 0);
      } else {
        agHelper.AssertElementLength(entityExplorer._widgetCards, 1);
        agHelper.AssertElementExist(".t--widget-card-draggable-customwidget");
      }

      agHelper.ClearTextField(entityExplorer._widgetSearchInput);
      // click to show all building blocks
      agHelper.GetElement(entityExplorer._widgetTagsList).each(($widgetTag) => {
        cy.wrap($widgetTag)
          .find(entityExplorer._widgetSeeMoreButton)
          .click({ force: true });
      });

      agHelper.AssertElementLength(
        entityExplorer._widgetCards,
        getTotalNumberOfWidgets(),
      );
    });
  },
);
