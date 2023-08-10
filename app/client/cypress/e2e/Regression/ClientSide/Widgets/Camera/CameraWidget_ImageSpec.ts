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
  it("1. Check camera intialization & modes", () => {
    entityExplorer.DragNDropWidget(draggableWidgets.CAMERA);
    agHelper.AssertAttribute(propPane._mode("Image"), "data-selected", "true");
    agHelper.AssertElementVisible(propPane._mode("Video"), 1);
    agHelper.AssertElementAbsence(widgetLocators.cameraErrorText);
    agHelper.AssertElementVisible(widgetLocators.cameraVideo);

    // Check camera resource is properly released on navigating away
    entityExplorer.AddNewPage();
    entityExplorer.SelectEntityByName("Page2");
    agHelper.AssertElementAbsence(widgetLocators.cameraVideo);

    entityExplorer.SelectEntityByName("Page1");
    agHelper.AssertElementVisible(widgetLocators.cameraVideo);
  });

  it("2. Verify Visible property of image mode in camera widget", () => {
    agHelper.AssertExistingToggleState("Visible", "true");
    propPane.ToggleJSMode("Visible", true);
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
    agHelper.AssertElementVisible(
      locators._widgetInCanvas(draggableWidgets.CAMERA),
    );
  });

  it("3. Verify Disabled property of image mode in camera widget", () => {
    agHelper.AssertExistingToggleState("Disabled", "false");
    propPane.ToggleJSMode("Disabled", true);
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
    agHelper
      .GetElement(widgetLocators.cameraWidgetScreen)
      .should("not.have.attr", "disabled");
  });

  it("4. Verify Mirrored property of image mode in camera widget", () => {
    agHelper.AssertExistingToggleState("Mirrored", "true");
    propPane.ToggleJSMode("Mirrored", true);
    propPane.EnterJSContext("Mirrored", "{{(55>45)?false:true}}", true, true);
    propPane.ToggleJSMode("Mirrored", false);
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
    propPane.ToggleJSMode("onImageCapture", true);
    propPane.EnterJSContext(
      "onImageCapture",
      "{{showAlert('Image Captured successfully!','success')}}",
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

    //Validate camera screen & icons
    agHelper.AssertElementVisible(widgetLocators.cameraImageVideoOnOffBtn);
    agHelper.AssertElementVisible(widgetLocators.cameraImageVideoDropdown);
    agHelper
      .GetElement(locators._widgetInDeployed(draggableWidgets.CAMERA))
      .matchImageSnapshot("cameraImageScreen");

    //Capture image
    agHelper.GetNClick(widgetLocators.cameraCaptureBtn);
    agHelper.AssertElementVisible(widgetLocators.cameraSaveBtn);
    agHelper.AssertElementVisible(widgetLocators.cameraImageDiscardBtn);

    //Validate image in preview screen
    agHelper
      .GetElement(locators._widgetInDeployed(draggableWidgets.CAMERA))
      .matchImageSnapshot("cameraImagePreviewScreen");

    //Save image
    agHelper.GetNClick(widgetLocators.cameraSaveBtn);
    agHelper.AssertElementVisible(widgetLocators.cameraRefreshBtn);

    //Validate image in refresh screen
    agHelper
      .GetElement(locators._widgetInDeployed(draggableWidgets.CAMERA))
      .matchImageSnapshot("cameraImageSavedScreen");

    //Refresh image
    agHelper.GetNClick(widgetLocators.cameraRefreshBtn);
    agHelper.AssertElementVisible(widgetLocators.cameraCaptureBtn);
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

  it("8. Should show default camera dropdown with default value as 'Back'", () => {
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
  });

  it("9. Should be able to change the default mobile camera option & Camera settings persist after switching cameras.", () => {
    propPane.AssertPropertiesDropDownValues("Default mobile camera", [
      "Back (Rear)",
      "Front (Selfie)",
    ]);
    propPane.AssertPropertiesDropDownCurrentValue(
      "Default mobile camera",
      "Back (Rear)",
    );
    propPane.SelectPropertiesDropDown(
      "Default mobile camera",
      "Front (Selfie)",
    );
    agHelper.AssertExistingToggleState("Mirrored", "false");
    agHelper.AssertExistingToggleState("Visible", "false");
  });
});
