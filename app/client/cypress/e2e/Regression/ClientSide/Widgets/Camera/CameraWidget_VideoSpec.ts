import widgetLocators from "../../../../../locators/Widgets.json");
import {
  agHelper,
  deployMode,
  draggableWidgets,
  entityExplorer,
  locators,
  propPane,
} from "../../../../../support/Objects/ObjectsCore";

describe("Camera widget - Video test", () => {
  it("1. Verify Visible property of video mode in camera widget", () => {
    entityExplorer.DragNDropWidget(draggableWidgets.CAMERA);
    agHelper
      .GetElement(propPane._mode("Image"))
      .should("have.attr", "data-selected", "true");
    agHelper.GetNClick(propPane._mode("Video"), 1, true);
    agHelper.AssertElementAbsence(widgetLocators.cameraErrorText);

    agHelper.AssertExistingToggleState("Visible", "true");
    propPane.ToggleJSMode("Visible", true);
    propPane.EnterJSContext("Visible", "{{(55>45)?false:true}}", true, true);
    deployMode.DeployApp();
    agHelper.AssertElementAbsence(
      locators._widgetInDeployed(draggableWidgets.CAMERA),
    );
    deployMode.NavigateBacktoEditor();
    entityExplorer.SelectEntityByName("Camera1");
    propPane.EnterJSContext("Visible","",false)
    propPane.ToggleJSMode("Visible", false);
    propPane.TogglePropertyState("Visible", "On");
  });

  it("2. Verify Disabled property of video mode in camera widget", () => {
    agHelper.AssertExistingToggleState("Disabled", "false");
    propPane.ToggleJSMode("Disabled", true);
    propPane.EnterJSContext("Disabled", "{{(45>55)?false:true}}", true, true);
    deployMode.DeployApp();
    agHelper
    .GetElement(widgetLocators.cameraWidgetScreen)
    .should("have.attr", "disabled");
    deployMode.NavigateBacktoEditor();
    entityExplorer.SelectEntityByName("Camera1");
    propPane.EnterJSContext("Disabled","",false)
    propPane.ToggleJSMode("Disabled", false);
    propPane.TogglePropertyState("Disabled", "Off");
  });

  it("3. Verify Mirrored property of video mode in camera widget", () => {
    agHelper.AssertExistingToggleState("Mirrored", "true");
    propPane.ToggleJSMode("Mirrored", true);
    propPane.EnterJSContext("Mirrored", "{{(55>45)?false:true}}", true, true);
    deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.CAMERA));
    agHelper
      .GetElement(locators._widgetInDeployed(draggableWidgets.CAMERA))
      .matchImageSnapshot("cameraVideoMirroredScreen");
    deployMode.NavigateBacktoEditor();
    entityExplorer.SelectEntityByName("Camera1");
    propPane.EnterJSContext("Mirrored","",false)
    propPane.ToggleJSMode("Mirrored", false);
    propPane.TogglePropertyState("Mirrored", "On");
  });

  it("4. Verify OnVideoSave event of video mode in camera widget", () => {
    propPane.ToggleJSMode("onVideoSave", true);
    propPane.EnterJSContext(
      "onVideoSave",
      "{{showAlert('Video Captured successfully!','success')}}",
    );
    propPane.ToggleJSMode("onVideoSave", false);

    propPane.SelectPlatformFunction("onVideoSave", "Download");
    agHelper.TypeText(
      propPane._actionSelectorFieldByLabel("Data to download"),
      "{{Camera1.videoBlobURL}}",
    );
    agHelper.TypeText(
      propPane._actionSelectorFieldByLabel("File name with extension"),
      "video.mp4",
    );
  });

  it("5. Test video capture , preview, save, refresh, download & icons in each stage", () => {
    deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.CAMERA));
    agHelper.AssertElementVisible(widgetLocators.cameraMicrophoneBtn);
    agHelper.AssertElementVisible(widgetLocators.cameraMicrophoneDropdown);
    agHelper.AssertElementVisible(widgetLocators.cameraVideoOnOffBtn);
    agHelper.AssertElementVisible(widgetLocators.cameraVideoDropdown);
    agHelper
      .GetElement(locators._widgetInDeployed(draggableWidgets.CAMERA))
      .matchImageSnapshot("cameraVideoScreen");
    agHelper.GetNClick(widgetLocators.cameraCaptureBtn);
    agHelper.Sleep(2000);
    agHelper.GetNClick(widgetLocators.cameraStopRecordingBtn);
    agHelper.AssertElementVisible(widgetLocators.cameraSaveBtn);
    agHelper.AssertElementVisible(widgetLocators.cameraVideodiscardBtn);
    agHelper.AssertElementVisible(widgetLocators.cameraVideoPlayBtn);
    agHelper
      .GetElement(locators._widgetInDeployed(draggableWidgets.CAMERA))
      .matchImageSnapshot("cameraVideoPreviewScreen");
    agHelper.GetNClick(widgetLocators.cameraSaveBtn);
    agHelper.AssertElementVisible(widgetLocators.cameraRefreshBtn);
    agHelper
      .GetElement(locators._widgetInDeployed(draggableWidgets.CAMERA))
      .matchImageSnapshot("cameraVideoSavedScreen");
    agHelper.GetNClick(widgetLocators.cameraRefreshBtn);
    agHelper.AssertElementVisible(widgetLocators.cameraCaptureBtn);
    agHelper.ValidateToastMessage("Captured successfully!");
    agHelper.DownloadDataNVerifyFile("video.mp4");
  });

  it("6. Capture multiple videos & check it does not overwrite previous captures", () => {
    deployMode.NavigateBacktoEditor();
    entityExplorer.SelectEntityByName("Camera1");
    propPane.SelectPlatformFunction("onVideoSave", "Download");
    agHelper.TypeText(
      propPane._actionSelectorFieldByLabel("Data to download"),
      "{{Camera1.imageBlobURL}}",
    );
    agHelper.TypeText(
      propPane._actionSelectorFieldByLabel("File name with extension"),
      "video1.mp4",
    );
    deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.CAMERA));
    agHelper.GetNClick(widgetLocators.cameraCaptureBtn);
    agHelper.Sleep(3000);
    agHelper.GetNClick(widgetLocators.cameraStopRecordingBtn);
    agHelper.GetNClick(widgetLocators.cameraSaveBtn);
    agHelper.ValidateToastMessage("Captured successfully!");
    agHelper.DownloadDataNVerifyFile("video1.mp4");
    agHelper.DownloadDataNVerifyFile("video.mp4");
  });

  //Skipping below tests due to issue - https://github.com/appsmithorg/appsmith/issues/26166
  it.skip("7. Video Recording test - Disabled Camera but Enabled Microphone", () => {
    deployMode.NavigateBacktoEditor();
    entityExplorer.SelectEntityByName("Camera1");
    agHelper.GetNClick(propPane._mode("Video"), 1);
    entityExplorer.DragNDropWidget(draggableWidgets.VIDEO);
    propPane.TypeTextIntoField("URL", "{{Camera1.videoBlobURL}}");

    deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.CAMERA));
    agHelper.GetNClick(widgetLocators.cameraVideoOnOffBtn);
    agHelper.GetNClick(widgetLocators.cameraCaptureBtn);
    agHelper.Sleep(3000);
    agHelper.GetNClick(widgetLocators.cameraStopRecordingBtn);
    agHelper.GetNClick(widgetLocators.cameraSaveBtn);
    agHelper.GetNClick(draggableWidgets.VIDEO);
    agHelper.Sleep(5000);
    agHelper.GetElement(widgetLocators.cameraVideo, 1).should(($el) => {
      const attrValue = $el[0].webkitAudioDecodedByteCount;
      expect(attrValue).be.greaterThan(30000);
    });
    agHelper.GetElement(widgetLocators.cameraVideo, 1).should(($el) => {
      const attrValue = $el[0].webkitVideoDecodedByteCount;
      expect(attrValue).be.lessThan(10000);
    });
  });

  it.skip("8. Video Recording test - Enabled Camera but Disabled Microphone", () => {
    entityExplorer.SelectEntityByName("Camera1");
    agHelper.GetNClick(propPane._mode("Video"), 1);
    entityExplorer.DragNDropWidget(draggableWidgets.VIDEO);
    propPane.TypeTextIntoField("URL", "{{Camera1.videoBlobURL}}");

    deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.CAMERA));
    agHelper.GetNClick(widgetLocators.cameraVideoOnOffBtn);
    agHelper.GetNClick(widgetLocators.cameraMicrophoneBtn);
    agHelper.GetNClick(widgetLocators.cameraCaptureBtn);
    agHelper.Sleep(3000);
    agHelper.GetNClick(widgetLocators.cameraStopRecordingBtn);
    agHelper.GetNClick(widgetLocators.cameraSaveBtn);
    agHelper.GetNClick(draggableWidgets.VIDEO);
    agHelper.Sleep(5000);
    agHelper.GetElement(widgetLocators.cameraVideo, 1).should(($el) => {
      const attrValue = $el[0].webkitAudioDecodedByteCount;
      expect(attrValue).be.lessThan(1000);
    });
    agHelper.GetElement(widgetLocators.cameraVideo, 1).should(($el) => {
      const attrValue = $el[0].webkitVideoDecodedByteCount;
      expect(attrValue).be.greaterThan(30000);
    });
  });

  it.skip("9. Video Recording test - Enabled Camera but Enabled Microphone", () => {
    entityExplorer.SelectEntityByName("Camera1");
    agHelper.GetNClick(propPane._mode("Video"), 1);
    entityExplorer.DragNDropWidget(draggableWidgets.VIDEO);
    propPane.TypeTextIntoField("URL", "{{Camera1.videoBlobURL}}");

    deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.CAMERA));
    agHelper.GetNClick(widgetLocators.cameraMicrophoneBtn);
    agHelper.GetNClick(widgetLocators.cameraCaptureBtn);
    agHelper.Sleep(3000);
    agHelper.GetNClick(widgetLocators.cameraStopRecordingBtn);
    agHelper.GetNClick(widgetLocators.cameraSaveBtn);
    agHelper.GetNClick(draggableWidgets.VIDEO);
    agHelper.Sleep(5000);
    agHelper.GetElement(widgetLocators.cameraVideo, 1).should(($el) => {
      const attrValue = $el[0].webkitAudioDecodedByteCount;
      expect(attrValue).be.greaterThan(30000);
    });
    agHelper.GetElement(widgetLocators.cameraVideo, 1).should(($el) => {
      const attrValue = $el[0].webkitVideoDecodedByteCount;
      expect(attrValue).be.greaterThan(30000);
    });
  });
});
