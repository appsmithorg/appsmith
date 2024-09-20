import {
  agHelper,
  assertHelper,
  draggableWidgets,
  locators,
  propPane,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

describe(
  "Dynamic Height Width validation",
  { tags: ["@tag.AutoHeight", "@tag.Sanity"] },
  function () {
    afterEach(() => {
      agHelper.SaveLocalStorageCache();
    });

    beforeEach(() => {
      agHelper.RestoreLocalStorageCache();
    });

    it("1. Validate change with auto height width for widgets", function () {
      agHelper.AddDsl("dynamicHeightContainerCheckboxdsl");

      EditorNavigation.SelectEntityByName(
        "CheckboxGroup1",
        EntityType.Widget,
        {},
        ["Container1"],
      );
      propPane.MoveToTab("Style");
      agHelper
        .GetWidgetCSSFrAttribute(
          `${locators._propertyControl}${locators._fontSelect}`,
          "font-size",
        )
        .then((dropdownFont) => {
          agHelper
            .GetElement(`${locators._propertyControl}${locators._fontInput}`)
            .last()
            .click({
              force: true,
            });
          agHelper
            .GetElement(propPane._optionContent)
            .should("have.length.greaterThan", 2)
            .its("length")
            .then((n) => {
              for (let i = 0; i < n; i++) {
                agHelper
                  .GetWidgetCSSFrAttribute(
                    propPane._optionContent,
                    "font-size",
                    i,
                  )
                  .then((selectedFont) => {
                    expect(dropdownFont).to.equal(selectedFont);
                  });
              }
            });
        });
      agHelper
        .GetWidgetCSSFrAttribute(
          `${locators._propertyControl}${locators._fontSelect}`,
          "font-family",
        )
        .then((dropdownFont) => {
          agHelper
            .GetElement(propPane._dropdownOptionSpan)
            .should("have.length.greaterThan", 2)
            .its("length")
            .then((n) => {
              for (let i = 0; i < n; i++) {
                agHelper
                  .GetWidgetCSSFrAttribute(
                    propPane._dropdownOptionSpan,
                    "font-family",
                    i,
                  )
                  .then((selectedFont) => {
                    expect(dropdownFont).to.equal(selectedFont);
                  });
              }
            });
        });
      propPane.MoveToTab("Content");
      agHelper
        .GetWidgetCSSHeight(
          locators._widgetInDeployed(draggableWidgets.CONTAINER),
        )
        .then((currentContainerHeight) => {
          agHelper
            .GetWidgetCSSHeight(
              locators._widgetInDeployed(draggableWidgets.CHECKBOXGROUP),
            )
            .then((currentCheckboxheight) => {
              agHelper.GetNClick(propPane._addOptionProperty);
              agHelper.Sleep(200);
              assertHelper.AssertNetworkStatus("@updateLayout", 200);
              agHelper.Sleep(3000);
              agHelper
                .GetWidgetCSSHeight(
                  locators._widgetInDeployed(draggableWidgets.CHECKBOXGROUP),
                )
                .then((updatedCheckboxheight) => {
                  expect(currentCheckboxheight).to.not.equal(
                    updatedCheckboxheight,
                  );
                });
            });
          agHelper.Sleep(2000);
          agHelper
            .GetWidgetCSSHeight(
              locators._widgetInDeployed(draggableWidgets.CONTAINER),
            )
            .then((updatedContainerHeight) => {
              expect(currentContainerHeight).to.not.equal(
                updatedContainerHeight,
              );
            });
        });
    });

    it("2. Validate container with auto height and child widgets with fixed height", function () {
      agHelper.AddDsl("dynamicHeigthContainerFixedDsl");

      EditorNavigation.SelectEntityByName(
        "CheckboxGroup1",
        EntityType.Widget,
        {},
        ["Container1"],
      );
      agHelper.AssertElementVisibility(propPane._propertyPaneHeightLabel);
      propPane.SelectPropertiesDropDown("height", "Auto Height");
      EditorNavigation.SelectEntityByName("Input1", EntityType.Widget);
      agHelper.AssertElementVisibility(propPane._propertyPaneHeightLabel);
      propPane.SelectPropertiesDropDown("height", "Auto Height");
      agHelper
        .GetWidgetCSSHeight(
          locators._widgetInDeployed(draggableWidgets.CONTAINER),
        )
        .then((currentHeight: number) => {
          EditorNavigation.SelectEntityByName("Container1", EntityType.Widget);
          propPane.SelectPropertiesDropDown("height", "Auto Height");
          agHelper.Sleep(4000);
          agHelper
            .GetWidgetCSSHeight(
              locators._widgetInDeployed(draggableWidgets.CONTAINER),
            )
            .then((updatedHeight: number) => {
              expect(currentHeight).to.not.equal(updatedHeight);
            });
        });
    });
  },
);
