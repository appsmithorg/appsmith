import {
  agHelper,
  draggableWidgets,
  deployMode,
  entityExplorer,
  locators,
  propPane,
  widgetLocators,
} from "../../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";

describe(
  "Image widget - Rotation & Download",
  { tags: ["@tag.Widget", "@tag.Image", "@tag.Binding"] },
  function () {
    const jpgImg =
      "https://community.appsmith.com/sites/default/files/styles/small_thumbnail/public/2024-03/aws-logo.jpg?itok=yG4bpfFs";
    before(() => {
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.IMAGE);
      propPane.UpdatePropertyFieldValue("Image", jpgImg);
      deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.IMAGE));
    });

    it("1. Validate enable rotation property", function () {
      agHelper.GetNClick(locators._widgetInDeployed(draggableWidgets.IMAGE));
      agHelper.AssertElementAbsence(widgetLocators.imageRotateClockwiseBtn);
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("Image1", EntityType.Widget);
      agHelper.AssertExistingToggleState("Enable rotation", "false");
      propPane.TogglePropertyState("Enable rotation", "On");
      deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.IMAGE));
      agHelper.Sleep(2000); //for widget to settle loading
      agHelper.HoverElement(locators._widgetInDeployed(draggableWidgets.IMAGE));
      agHelper.GetNClick(locators._widgetInDeployed(draggableWidgets.IMAGE));
      agHelper.AssertElementVisibility(widgetLocators.imageRotateClockwiseBtn);
      agHelper.AssertElementVisibility(
        widgetLocators.imageRotateAntiClockwiseBtn,
      );
      agHelper.GetHoverNClick(widgetLocators.imageRotateClockwiseBtn);
      agHelper.AssertCSS(
        widgetLocators.image,
        "transform",
        "matrix(0, 1, -1, 0, 0, 0)",
      );
      agHelper.GetHoverNClick(widgetLocators.imageRotateAntiClockwiseBtn);
      agHelper.AssertCSS(
        widgetLocators.image,
        "transform",
        "matrix(1, 0, 0, 1, 0, 0)",
      );
    });

    it("2. Verify image download", function () {
      agHelper.HoverElement(locators._widgetInDeployed(draggableWidgets.IMAGE));
      agHelper.AssertElementAbsence(widgetLocators.imageDownloadBtn);
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("Image1", EntityType.Widget);
      agHelper.AssertExistingToggleState("Enable download", "false");
      propPane.TogglePropertyState("Enable download", "On");
      deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.IMAGE));
      agHelper.Sleep(2000); //for widget to settle loading
      agHelper.GetNClick(locators._widgetInDeployed(draggableWidgets.IMAGE));
      agHelper.HoverElement(locators._widgetInDeployed(draggableWidgets.IMAGE));
      agHelper.AssertElementVisibility(widgetLocators.imageDownloadBtn);
      agHelper.AssertAttribute(widgetLocators.imageDownloadBtn, "href", jpgImg);
    });
  },
);
