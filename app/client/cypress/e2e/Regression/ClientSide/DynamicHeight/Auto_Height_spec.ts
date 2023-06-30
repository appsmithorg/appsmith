import {
  entityExplorer,
  locators,
  agHelper,
  propPane,
  assertHelper,
  draggableWidgets,
} from "../../../../support/Objects/ObjectsCore";

describe("Dynamic Height Width validation", function () {
  afterEach(() => {
    agHelper.SaveLocalStorageCache();
  });

  beforeEach(() => {
    agHelper.RestoreLocalStorageCache();
  });

  it("1. Validate change with auto height width for widgets", function () {
    cy.fixture("dynamicHeightContainerCheckboxdsl").then((val) => {
      agHelper.AddDsl(val);
    });
    entityExplorer.SelectEntityByName("Container1", "Widgets");
    entityExplorer.SelectEntityByName("CheckboxGroup1", "Container1");
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
          .GetElement(locators._optionContent)
          .should("have.length.greaterThan", 2)
          .its("length")
          .then((n) => {
            for (let i = 0; i < n; i++) {
              agHelper
                .GetWidgetCSSFrAttribute(
                  locators._optionContent,
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
          .GetElement(locators._dropdownOptionSpan)
          .should("have.length.greaterThan", 2)
          .its("length")
          .then((n) => {
            for (let i = 0; i < n; i++) {
              agHelper
                .GetWidgetCSSFrAttribute(
                  locators._dropdownOptionSpan,
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
            agHelper.GetNClick(locators._addOptionProperty);
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
            expect(currentContainerHeight).to.not.equal(updatedContainerHeight);
          });
      });
  });

  it("2. Validate container with auto height and child widgets with fixed height", function () {
    cy.fixture("dynamicHeigthContainerFixedDsl").then((val) => {
      agHelper.AddDsl(val);
    });
    entityExplorer.SelectEntityByName("CheckboxGroup1", "Container1");
    agHelper.AssertElementVisible(locators._propertyPaneHeightLabel);
    propPane.SelectPropertiesDropDown("height", "Auto Height");
    entityExplorer.SelectEntityByName("Input1");
    agHelper.AssertElementVisible(locators._propertyPaneHeightLabel);
    propPane.SelectPropertiesDropDown("height", "Auto Height");
    agHelper
      .GetWidgetCSSHeight(
        locators._widgetInDeployed(draggableWidgets.CONTAINER),
      )
      .then((currentHeight: number) => {
        entityExplorer.SelectEntityByName("Container1", "Widgets");
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
});
