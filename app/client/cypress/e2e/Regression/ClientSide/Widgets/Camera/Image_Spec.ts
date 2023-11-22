import widgetLocators from "../../../../../locators/Widgets.json";
import {
  agHelper,
  deployMode,
  draggableWidgets,
  entityExplorer,
  locators,
  propPane,
  table,
} from "../../../../../support/Objects/ObjectsCore";

describe("Camera widget - Image test", () => {
  before(() => {
    //Reset video source to default incase it got changed in other specs
    cy.task("resetVideoSource");
  });

  it("1. Check camera intialization & modes", () => {
    entityExplorer.DragNDropWidget(draggableWidgets.CAMERA);
    agHelper.AssertAttribute(propPane._mode("Image"), "data-selected", "true");
    agHelper.AssertElementVisibility(propPane._mode("Video"), true, 1);
    agHelper.AssertElementAbsence(widgetLocators.cameraErrorText);
    agHelper.AssertElementVisibility(widgetLocators.cameraVideo);

    // Check camera resource is properly released on navigating away
    entityExplorer.AddNewPage();
    entityExplorer.SelectEntityByName("Page2");
    agHelper.AssertElementAbsence(widgetLocators.cameraVideo);

    entityExplorer.SelectEntityByName("Page1");
    agHelper.AssertElementVisibility(widgetLocators.cameraVideo);
  });

  it("2. Verify Visible property of image mode in camera widget", () => {
    agHelper.AssertExistingToggleState("Visible", "true");
    propPane.EnterJSContext("Visible", "{{(55>45)?false:true}}", true, true);
    deployMode.DeployApp();
    agHelper.AssertElementAbsence(
      locators._widgetInDeployed(draggableWidgets.CAMERA),
    );
    deployMode.NavigateBacktoEditor();
    entityExplorer.SelectEntityByName("Camera1");
    propPane.EnterJSContext("Visible", "", false);
    propPane.ToggleJSMode("Visible", false);
    propPane.TogglePropertyState("Visible", "On");
    deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.CAMERA));
    agHelper.AssertElementVisibility(
      locators._widgetInDeployed(draggableWidgets.CAMERA),
    );
  });

  it("3. Verify Disabled property of image mode in camera widget", () => {
    deployMode.NavigateBacktoEditor();
    entityExplorer.SelectEntityByName("Camera1");
    agHelper.AssertExistingToggleState("Disabled", "false");
    propPane.EnterJSContext("Disabled", "{{(45>55)?false:true}}", true, true);
    deployMode.DeployApp();
    agHelper
      .GetElement(widgetLocators.cameraWidgetScreen)
      .should("have.attr", "disabled");
    deployMode.NavigateBacktoEditor();
    entityExplorer.SelectEntityByName("Camera1");
    propPane.EnterJSContext("Disabled", "", false);
    propPane.ToggleJSMode("Disabled", false);
    propPane.TogglePropertyState("Disabled", "Off");
    deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.CAMERA));
    agHelper
      .GetElement(widgetLocators.cameraWidgetScreen)
      .should("not.have.attr", "disabled");
  });

  it("4. Verify Mirrored property of image mode in camera widget", () => {
    deployMode.NavigateBacktoEditor();
    entityExplorer.SelectEntityByName("Camera1");
    agHelper.AssertExistingToggleState("Mirrored", "true");
    propPane.EnterJSContext("Mirrored", "{{(55>45)?false:true}}", true, true);
    deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.CAMERA));
    agHelper
      .GetElement(locators._widgetInDeployed(draggableWidgets.CAMERA))
      .matchImageSnapshot("cameraImageMirroredScreen", {
        failureThreshold: 0.15,
        failureThresholdType: "percent",
        customDiffConfig: { threshold: 0.15 },
      });
    deployMode.NavigateBacktoEditor();
    entityExplorer.SelectEntityByName("Camera1");
    propPane.EnterJSContext("Mirrored", "", false);
    propPane.ToggleJSMode("Mirrored", false);
    propPane.TogglePropertyState("Mirrored", "On");
  });

  it("5. Validate OnImageCapture event of image mode in camera widget", () => {
    propPane.EnterJSContext(
      "onImageCapture",
      "{{showAlert('Image Captured successfully!','success')}}",
      true,
    );
    propPane.ToggleJSMode("onImageCapture", false);

    propPane.SelectPlatformFunction("onImageCapture", "Download");
    agHelper.TypeText(
      propPane._actionSelectorFieldByLabel("Data to download"),
      "{{Camera1.imageBlobURL}}",
    );
    agHelper.TypeText(
      propPane._actionSelectorFieldByLabel("File name with extension"),
      "image.png",
    );
  });

  it("6. Test image capture , preview, save, refresh, download & icons in each stage", () => {
    deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.CAMERA));
    agHelper.Sleep(2000);
    //Validate camera screen & icons
    agHelper.AssertElementVisibility(widgetLocators.cameraImageVideoOnOffBtn);
    agHelper.AssertElementVisibility(widgetLocators.cameraImageVideoDropdown);
    agHelper
      .GetElement(locators._widgetInDeployed(draggableWidgets.CAMERA))
      .matchImageSnapshot("cameraImageScreen");

    //Capture image
    agHelper.GetNClick(widgetLocators.cameraCaptureBtn);
    agHelper.AssertElementVisibility(widgetLocators.cameraSaveBtn);
    agHelper.AssertElementVisibility(widgetLocators.cameraImageDiscardBtn);

    //Validate image in preview screen
    agHelper
      .GetElement(locators._widgetInDeployed(draggableWidgets.CAMERA))
      .matchImageSnapshot("cameraImagePreviewScreen");

    //Save image
    agHelper.GetNClick(widgetLocators.cameraSaveBtn);
    agHelper.AssertElementVisibility(widgetLocators.cameraRefreshBtn);

    //Validate image in refresh screen
    agHelper
      .GetElement(locators._widgetInDeployed(draggableWidgets.CAMERA))
      .matchImageSnapshot("cameraImageSavedScreen");

    //Refresh image
    agHelper.GetNClick(widgetLocators.cameraRefreshBtn);
    agHelper.AssertElementVisibility(widgetLocators.cameraCaptureBtn);
    agHelper.ValidateToastMessage("Captured successfully!");

    //Validate image download OnImageCapture event
    table.ValidateDownloadNVerify("image.png");
  });

  it("7. Capture multiple images & check it does not overwrite previous captures", () => {
    deployMode.NavigateBacktoEditor();
    entityExplorer.SelectEntityByName("Camera1");
    propPane.SelectPlatformFunction("onImageCapture", "Download");
    agHelper.TypeText(
      propPane._actionSelectorFieldByLabel("Data to download"),
      "{{Camera1.imageBlobURL}}",
    );
    agHelper.TypeText(
      propPane._actionSelectorFieldByLabel("File name with extension"),
      "image1.png",
    );
    deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.CAMERA));
    agHelper.GetNClick(widgetLocators.cameraCaptureBtn);
    agHelper.GetNClick(widgetLocators.cameraSaveBtn);
    agHelper.ValidateToastMessage("Captured successfully!");
    table.ValidateDownloadNVerify("image1.png");
    table.ValidateDownloadNVerify("image.png");
  });

  it(
    "8. a)Should show default camera dropdown with default value as 'Back' \n" +
      "b)Should be able to change the default mobile camera option & Camera settings persist after switching cameras.",
    () => {
      deployMode.NavigateBacktoEditor();
      entityExplorer.SelectEntityByName("Camera1");
      propPane.TogglePropertyState("Mirrored", "Off");
      propPane.TogglePropertyState("Visible", "Off");
      agHelper.AssertElementExist(
        propPane._propertyControl("defaultmobilecamera"),
      );
      propPane.AssertPropertiesDropDownCurrentValue(
        "Default mobile camera",
        "Back (Rear)",
      );
      propPane.AssertPropertiesDropDownValues("Default mobile camera", [
        "Back (Rear)",
        "Front (Selfie)",
      ]);
      propPane.SelectPropertiesDropDown(
        "Default mobile camera",
        "Front (Selfie)",
      );
      agHelper.AssertExistingToggleState("Mirrored", "false");
      agHelper.AssertExistingToggleState("Visible", "false");
    },
  );
});
