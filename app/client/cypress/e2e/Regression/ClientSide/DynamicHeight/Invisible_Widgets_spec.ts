import {
  locators,
  agHelper,
  deployMode,
  draggableWidgets,
} from "../../../../support/Objects/ObjectsCore";

describe(
  "Fixed Invisible widgets and auto height containers",
  { tags: ["@tag.AutoHeight"] },
  () => {
    before(() => {
      // Create a page with a divider below a button widget and a checkbox widget below a filepicker widget
      // Button widget and filepicker widgets are fixed height widgets
      agHelper.AddDsl("autoHeightInvisibleWidgetsDSL");
    });

    it("1. Divider should be below Button Widget in edit mode", () => {
      // This test checks for the height of the button widget and the filepicker widget
      // As well as the top value for the widgets below button and filepicker (divider and checkbox respectively)
      agHelper.AssertCSS(
        locators._widgetInDeployed(draggableWidgets.BUTTON),
        "height",
        "230px",
        0,
      );
      agHelper.AssertCSS(
        locators._widgetInDeployed(draggableWidgets.FILEPICKER),
        "height",
        "90px",
        0,
      );
      agHelper.AssertCSS(
        locators._widgetInDeployed(draggableWidgets.DIVIDER),
        "top",
        "246px",
        0,
      );
      agHelper.AssertCSS(
        locators._widgetInDeployed(draggableWidgets.CHECKBOX),
        "top",
        "96px",
        0,
      );
    });

    it("2. Divider should move up by the height of the button widget in preview mode", () => {
      // This tests if the divider and checkbox widget move up by an appropriate amount in preview mode.
      agHelper.AssertElementVisibility(locators._previewModeToggle("edit"));
      agHelper.GetNClick(locators._previewModeToggle("edit"));

      agHelper.AssertCSS(
        locators._widgetInDeployed(draggableWidgets.DIVIDER),
        "top",
        "16px",
        0,
      );
      agHelper.AssertCSS(
        locators._widgetInDeployed(draggableWidgets.CHECKBOX),
        "top",
        "6px",
        0,
      );
    });

    it("3. Divider should move up by the height of the button widget in view mode", () => {
      // This tests if the divider and checkbox widget move up by an appropriate amount in view mode.
      deployMode.DeployApp();
      agHelper.AssertCSS(
        locators._widgetInDeployed(draggableWidgets.DIVIDER),
        "top",
        "16px",
        0,
      );
      agHelper.AssertCSS(
        locators._widgetInDeployed(draggableWidgets.CHECKBOX),
        "top",
        "6px",
        0,
      );
    });
  },
);
