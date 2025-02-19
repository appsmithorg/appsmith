import {
  agHelper,
  draggableWidgets,
  entityExplorer,
  deployMode,
  propPane,
  locators,
  widgetLocators,
} from "../../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";

describe(
  "Audio Recorder functionality tests",
  { tags: ["@tag.Widget", "@tag.Audio", "@tag.Binding"] },
  () => {
    before(() => {
      entityExplorer.DragDropWidgetNVerify(
        draggableWidgets.AUDIORECORDER,
        200,
        200,
      );
    });

    it("1. Verify properties and sub events are present and js convertible", () => {
      // assert properties are present
      propPane.Search("general");
      propPane.AssertIfPropertyOrSectionExists("general", "CONTENT");
      propPane.Search("events");
      propPane.AssertIfPropertyOrSectionExists("events", "CONTENT");
      agHelper.ClearTextField(propPane._propertyPaneSearchInput);
      // verfify sub events are js convertible
      propPane.ToggleJSMode("Visible", true);
      agHelper.AssertElementExist(locators._existingFieldTextByName("Visible"));
      propPane.ToggleJSMode("Visible", false);
      propPane.ToggleJSMode("Disabled", true);
      agHelper.AssertElementExist(
        locators._existingFieldTextByName("Disabled"),
      );
      propPane.ToggleJSMode("Disabled", false);
      propPane.ToggleJSMode("Animate loading", true);
      agHelper.AssertElementExist(
        locators._existingFieldTextByName("Animate loading"),
      );
      propPane.ToggleJSMode("Animate loading", false);

      propPane.ToggleJSMode("onRecordingStart", true);
      agHelper.AssertElementExist(
        locators._existingFieldTextByName("onRecordingStart"),
      );
      propPane.ToggleJSMode("onRecordingStart", false);
      propPane.ToggleJSMode("onRecordingComplete", true);
      agHelper.AssertElementExist(
        locators._existingFieldTextByName("onRecordingComplete"),
      );
      propPane.ToggleJSMode("onRecordingComplete", false);
    });

    it("2. Verify visible and disabled property", () => {
      propPane.MoveToTab("Content");
      propPane.TogglePropertyState("Visible", "Off");
      deployMode.DeployApp();
      // verify in view mode
      agHelper.AssertElementAbsence(
        locators._widgetInCanvas(draggableWidgets.AUDIORECORDER),
      );
      deployMode.NavigateBacktoEditor();
      // verify in preview mode
      agHelper.GetNClick(locators._enterPreviewMode);
      //verify widget is not present
      agHelper.AssertElementAbsence(
        locators._widgetInCanvas(draggableWidgets.AUDIORECORDER),
      );
      //Exit preview mode
      agHelper.GetNClick(locators._exitPreviewMode);
      EditorNavigation.SelectEntityByName("AudioRecorder1", EntityType.Widget);
      propPane.TogglePropertyState("Visible", "On");
      // verify recorder is disabled
      propPane.TogglePropertyState("Disabled", "On");
      agHelper.AssertElementEnabledDisabled(widgetLocators.recorderPrompt);
      deployMode.DeployApp();
      agHelper.Sleep(2000);
      agHelper.AssertElementEnabledDisabled(widgetLocators.recorderPrompt);
      deployMode.NavigateBacktoEditor();
      // verify in preview mode
      agHelper.GetNClick(locators._enterPreviewMode);
      //verify widget is disabled
      agHelper.AssertElementEnabledDisabled(widgetLocators.recorderPrompt);
      //Exit preview mode
      agHelper.GetNClick(locators._exitPreviewMode);
    });

    it("3. Verify onRecordingStart and onRecordingStart Events", () => {
      EditorNavigation.SelectEntityByName("AudioRecorder1", EntityType.Widget);
      propPane.TogglePropertyState("Disabled", "Off");
      propPane.SelectPlatformFunction("onRecordingStart", "Show alert");
      agHelper.EnterActionValue("Message", "Recording Started");
      propPane.SelectPlatformFunction("onRecordingComplete", "Show alert");
      agHelper.EnterActionValue("Message", "Recording Completed");
      agHelper.GetNClick(widgetLocators.recorderPrompt);
      agHelper.GetNClick(widgetLocators.recorderStart);
      agHelper.ValidateToastMessage("Recording Started");
      agHelper.WaitUntilAllToastsDisappear();
      agHelper.Sleep(2000); //for recorder to record
      agHelper.GetNClick(widgetLocators.recorderStop);
      agHelper.ValidateToastMessage("Recording Completed");
      // verify in deploy mode
      deployMode.DeployApp();
      agHelper.Sleep(2000);
      agHelper.GetNClick(widgetLocators.recorderPrompt);
      agHelper.GetNClick(widgetLocators.recorderStart);
      agHelper.ValidateToastMessage("Recording Started");
      agHelper.WaitUntilAllToastsDisappear();
      agHelper.GetNClick(widgetLocators.recorderStop);
      agHelper.ValidateToastMessage("Recording Completed");
      agHelper.WaitUntilAllToastsDisappear();
      deployMode.NavigateBacktoEditor();
      // verify in preview mode
      agHelper.GetNClick(locators._enterPreviewMode);
      agHelper.GetNClick(widgetLocators.recorderPrompt);
      agHelper.GetNClick(widgetLocators.recorderStart);
      agHelper.ValidateToastMessage("Recording Started");
      agHelper.WaitUntilAllToastsDisappear();
      agHelper.GetNClick(widgetLocators.recorderStop);
      agHelper.ValidateToastMessage("Recording Completed");
      //Exit preview mode
      agHelper.GetNClick(locators._exitPreviewMode);
    });

    it("4.Verify Style tab's properties: Button color, icon color, border radius and Box shadow", () => {
      EditorNavigation.SelectEntityByName("AudioRecorder1", EntityType.Widget);
      propPane.MoveToTab("Style");
      propPane.EnterJSContext("Button color", "#FFC13D");
      agHelper.Sleep(1000);
      propPane.SelectColorFromColorPicker("iconcolor", -15);
      agHelper.AssertCSS(
        widgetLocators.recorderPrompt,
        "background-color",
        "rgb(255, 193, 61)",
      );
      propPane.EnterJSContext("Box shadow", "Small");
      agHelper
        .GetElement(widgetLocators.recorderPrompt)
        .should("have.css", "box-shadow")
        .and("not.eq", "none");
      propPane.EnterJSContext("Border radius", "none");
      agHelper.AssertCSS(
        widgetLocators.recorderPrompt,
        "border-radius",
        "3px",
        0,
      );
    });
  },
);
