import {
  agHelper,
  draggableWidgets,
  entityExplorer,
  deployMode,
  propPane,
  locators,
} from "../../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";

const URL = "https://assets.appsmith.com/widgets/birds_chirping.mp3";

describe("excludeForAirgap", "Audio Widget functionality tests", () => {
  before(() => {
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.AUDIO, 200, 200);
  });
  it("1. Audio widget property verification", () => {
    EditorNavigation.SelectEntityByName("Audio1", EntityType.Widget);
    // assert properties are present
    propPane.Search("general");
    propPane.AssertIfPropertyOrSectionExists("general", "CONTENT");
    propPane.Search("data");
    propPane.AssertIfPropertyOrSectionExists("data", "CONTENT");
    propPane.Search("events");
    propPane.AssertIfPropertyOrSectionExists("events", "CONTENT");
    agHelper.ClearTextField(propPane._propertyPaneSearchInput);
    // validate default url link
    propPane.ValidatePropertyFieldValue("URL", URL);
  });

  it("2. Verify all audio widget events", () => {
    // verify autoplay is disabled
    propPane.TogglePropertyState("Autoplay", "On");
    //Uncheck the disabled checkbox and validate
    propPane.TogglePropertyState("Visible", "Off");
    deployMode.DeployApp();
    agHelper.AssertElementAbsence(
      locators._widgetInCanvas(draggableWidgets.AUDIO),
    );
    deployMode.NavigateBacktoEditor();
    // verify in preview mode
    agHelper.GetNClick(locators._enterPreviewMode);
    //verify widget is not present
    agHelper.AssertElementAbsence(
      locators._widgetInCanvas(draggableWidgets.AUDIO),
    );
    //Exit preview mode
    agHelper.GetNClick(locators._exitPreviewMode);
    EditorNavigation.SelectEntityByName("Audio1", EntityType.Widget);
    propPane.SelectPlatformFunction("onPlay", "Show alert");
    agHelper.EnterActionValue("Message", "Audio Played");
    propPane.ToggleJSMode("onPlay", true);
    agHelper.AssertAutoSave();
    propPane.TogglePropertyState("Autoplay", "On");
    // verify onPause event
    propPane.SelectPlatformFunction("onPause", "Show alert");
    agHelper.EnterActionValue("Message", "Audio Paused");
    agHelper.AssertAutoSave();
    // Add event for onEnd
    propPane.SelectPlatformFunction("onEnd", "Show alert");
    agHelper.EnterActionValue("Message", "Audio Ended");
    agHelper.AssertAutoSave();
    propPane.TogglePropertyState("Visible", "On");
    // Verify audio played in deploy mode
    deployMode.DeployApp();
    agHelper.ValidateToastMessage("Audio Ended", 0, 1);
    // Because of bug:13876, audio play alert in deploy mode cant be tested
  });
});
