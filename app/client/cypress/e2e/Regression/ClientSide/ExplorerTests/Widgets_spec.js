const apiwidget = require("../../../../locators/apiWidgetslocator.json");
import explorer from "../../../../locators/explorerlocators.json";
import * as _ from "../../../../support/Objects/ObjectsCore";

describe("Entity explorer tests related to widgets and validation", function () {
  before(() => {
    _.agHelper.AddDsl("displayWidgetDsl");
  });

  // Taken from here appsmith/app/client/src/constants/WidgetConstants.tsx
  const WIDGET_TAGS = {
    ESSENTIAL_WIDGETS: "Essential widgets",
    BUTTONS: "Buttons",
    INPUT: "Inputs",
    SELECT: "Selects",
    TOGGLES: "Toggles",
    FORMS: "Forms",
    MULTIMEDIA: "Multimedia",
    COLLECTIONS_AND_ORGANIZATIONS: "Collections & organizations",
    LAYOUT: "Layout",
    SLIDERS: "Sliders",
    CONTENT: "Content",
    EXTERNAL_INPUT: "External input",
  };

  // Taken from here appsmith/app/client/src/constants/WidgetConstants.tsx
  const ESSENTIAL_WIDGETS_ORDER = {
    TEXT_WIDGET: 1,
    INPUT_WIDGET_V2: 2,
    TABLE_WIDGET_V2: 3,
    BUTTON_WIDGET: 4,
    LIST_WIDGET_V2: 5,
    JSON_FORM_WIDGET: 6,
  };

  // When adding a new widget or tag, we need to manually add it to this list.
  const WIDGETS_CATALOG = {
    "Essential widgets": [
      "Input",
      "JSON Form",
      "List",
      "Select",
      "Table",
      "Text",
    ],
    Buttons: ["Button", "Button Group", "Icon button", "Menu button"],
    Inputs: [
      "Currency Input",
      "DatePicker",
      "FilePicker",
      "Input",
      "Phone Input",
      "Rich Text Editor",
    ],
    Selects: ["Multi TreeSelect", "MultiSelect", "Select", "TreeSelect"],
    Toggles: [
      "Checkbox",
      "Checkbox Group",
      "Radio Group",
      "Switch",
      "Switch Group",
    ],
    Forms: ["Form", "JSON Form"],
    Multimedia: ["Audio", "Document Viewer", "Image", "Video"],
    "Collections & organizations": [
      "Chart",
      "Iframe",
      "List",
      "Map Chart",
      "Stats Box",
      "Table",
    ],
    Layout: ["Container", "Divider", "Modal", "Tabs"],
    Sliders: ["Category Slider", "Number Slider", "Range Slider"],
    Content: ["Map", "Progress", "Rating", "Text"],
    "External input": ["Audio Recorder", "Camera", "Code Scanner"],
  };

  const getTotalNumberOfWidgets = () => {
    return Object.values(WIDGETS_CATALOG).reduce(
      (totalLength, widgets) => totalLength + widgets.length,
      0,
    );
  };

  it("1. Widget edit/delete/copy to clipboard validation", function () {
    cy.CheckAndUnfoldEntityItem("Widgets");
    cy.selectEntityByName("Container4");
    cy.get(".t--entity-collapse-toggle").eq(4).click({ force: true });
    cy.get(".t--entity-name").contains("Text1").trigger("mouseover");
    cy.get("[data-testid='t--entity-item-Text1'] .entity-context-menu").click({
      force: true,
    });
    cy.selectAction("Show bindings");
    cy.get(apiwidget.propertyList).then(function ($lis) {
      expect($lis).to.have.length(2);
      expect($lis.eq(0)).to.contain("{{Text1.isVisible}}");
      expect($lis.eq(1)).to.contain("{{Text1.text}}");
    });
    cy.get(".t--entity-name").contains("Text1").trigger("mouseover");
    cy.get("[data-testid='t--entity-item-Text1'] .entity-context-menu").click({
      force: true,
    });
    cy.selectAction("Edit name");
    cy.EditApiNameFromExplorer("TextUpdated");
    cy.get(".t--entity-name").contains("TextUpdated").trigger("mouseover");
    cy.get(
      "[data-testid='t--entity-item-TextUpdated'] .entity-context-menu",
    ).click({ force: true });
    cy.selectAction("Show bindings");
    cy.get(apiwidget.propertyList).then(function ($lis) {
      expect($lis).to.have.length(2);
      expect($lis.eq(0)).to.contain("{{TextUpdated.isVisible}}");
      expect($lis.eq(1)).to.contain("{{TextUpdated.text}}");
    });
    cy.DeleteWidgetFromSideBar();
  });

  it("2. All widget tags should be visible and open by default.", () => {
    cy.get(explorer.explorerWidgetTab).click({ force: true });

    _.agHelper.AssertElementLength(
      explorer.widgetTagsList,
      Object.keys(WIDGET_TAGS).length,
    );

    cy.get(explorer.widgetTagsList).each(($widgetTag) => {
      cy.wrap($widgetTag)
        .find(".ads-v2__content")
        .should("have.css", "display", "flex");
    });
  });

  it("3. All widgets should be present within their tags and these tags should be collapsible", () => {
    cy.get(explorer.widgetTagsList).each(($widgetTag) => {
      // check that tags are collapsible
      cy.wrap($widgetTag).find(".ads-v2-collapsible__header").click({
        force: true,
      });
      cy.wrap($widgetTag)
        .find(".ads-v2__content")
        .should("have.css", "display", "none");
      cy.wrap($widgetTag).find(".ads-v2-collapsible__header").click({
        force: true,
      });

      // check that all widgets are present within their tags
      const widgetsInThisTag = [];

      cy.wrap($widgetTag)
        .find(explorer.widgetCards + " span.ads-v2-text")
        .each(($widgetName) => {
          const value = $widgetName.text();

          widgetsInThisTag.push(value);
        })
        .then(() => {
          cy.wrap($widgetTag)
            .find(".ads-v2-collapsible__header span.ads-v2-text")
            .then(($widgetTagTitle) => {
              const expectedWidgetsInThisTag =
                WIDGETS_CATALOG[$widgetTagTitle.text()].sort();
              widgetsInThisTag.sort();

              expect(widgetsInThisTag).to.deep.eq(expectedWidgetsInThisTag);
            });
        });
    });
  });

  it("4. All widgets should be ordered alphabetically within their tags, except Essential widgets, which should be sorted by their static rank.", () => {
    cy.get(
      `${explorer.widgetTagsList}:not(.widget-tag-collapisble-essential-widgets)`,
    ).each(($widgetTag) => {
      const widgetsInThisTag = [];

      cy.wrap($widgetTag)
        .find(explorer.widgetCards + " span.ads-v2-text")
        .each(($widgetName) => {
          const value = $widgetName.text();

          widgetsInThisTag.push(value);
        })
        .then(() => {
          const sortedWidgetsInThisTag = [...widgetsInThisTag].sort();

          expect(widgetsInThisTag).to.deep.eq(sortedWidgetsInThisTag);
        });
    });

    const widgetsInEssentialWidgetsTag = [];
    cy.get(
      `${explorer.widgetTagsList}.widget-tag-collapisble-essential-widgets`,
    )
      .find(explorer.widgetCards + " span.ads-v2-text")
      .each(($widgetName) => {
        const value = $widgetName.text();

        widgetsInEssentialWidgetsTag.push(value);
      })
      .then(() => {
        const sortedWidgetsInEssentialWidgetsTag = [
          ...widgetsInEssentialWidgetsTag,
        ].sort(
          (a, b) => ESSENTIAL_WIDGETS_ORDER[a] - ESSENTIAL_WIDGETS_ORDER[b],
        );

        expect(widgetsInEssentialWidgetsTag).to.deep.eq(
          sortedWidgetsInEssentialWidgetsTag,
        );
      });
  });

  it("5. Widget search should work", () => {
    cy.get(explorer.widgetSearchInput).type("text");
    cy.get(explorer.widgetCards).should("have.length", 3);
    cy.get(explorer.widgetSearchInput).type("p");
    cy.get(explorer.widgetCards).should("have.length", 2);
    cy.get(explorer.widgetSearchInput).clear();
    cy.get(explorer.widgetSearchInput).type("cypress");
    cy.get(explorer.widgetCards).should("have.length", 0);
    cy.get(explorer.widgetSearchInput).clear();
    cy.get(explorer.widgetCards).should(
      "have.length",
      getTotalNumberOfWidgets(),
    );
  });
});
