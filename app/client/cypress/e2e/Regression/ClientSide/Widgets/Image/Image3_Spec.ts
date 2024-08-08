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
import { urlToBase64 } from "../../../../../../src/widgets/ImageWidget/helper";

describe(
  "Image widget - Rotation & Download",
  { tags: ["@tag.Widget", "@tag.Image"] },
  function () {
    const jpgImg = "https://jpeg.org/images/jpegsystems-home.jpg";
    let base64Url: string;
    before(function () {
      cy.wrap(urlToBase64(jpgImg)).then((url) => {
        base64Url = url as string;
      });

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
      cy.wrap(base64Url).then((url) => {
        // This is to validate the final base64 url which is used for download as href in the anchor tag
        agHelper.AssertAttribute(widgetLocators.imageDownloadBtn, "href", url);
      });
    });
  },
);
