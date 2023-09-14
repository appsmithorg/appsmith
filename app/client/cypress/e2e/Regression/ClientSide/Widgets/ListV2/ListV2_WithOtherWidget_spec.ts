import {
  agHelper,
  locators,
  entityExplorer,
  propPane,
} from "../../../../../support/Objects/ObjectsCore";

describe("List widget V2 functionality with audio and video widgets", () => {
  before(() => {
    agHelper.AddDsl("listV2AudioVideoDsl");
    entityExplorer.DragDropWidgetNVerify("audiowidget", 700, 500);
    entityExplorer.DragDropWidgetNVerify("audiorecorderwidget", 700, 600);
    entityExplorer.DragDropWidgetNVerify("videowidget", 400, 700);
    entityExplorer.DragDropWidgetNVerify("textwidget", 700, 700);
  });

  after(() => {
    agHelper.SelectAllWidgets();
    agHelper.PressDelete();
  });

  it("1. Verify property visibility", () => {
    const dataProperties = ["url"];

    const generalProperties = ["autoplay", "visible", "animateloading"];

    const eventsProperties = ["onplay", "onpause", "onend"];

    const audioRecorderGeneralProperties = [
      "visible",
      "disabled",
      "animateloading",
    ];

    const audioRecorderEventsProperties = [
      "onrecordingstart",
      "onrecordingcomplete",
    ];

    entityExplorer.SelectEntityByName("Audio2", "Widgets");
    // Audio widget outside List
    propPane.AssertPropertyVisibility(dataProperties, "data");
    propPane.AssertPropertyVisibility(generalProperties, "general");
    propPane.AssertPropertyVisibility(eventsProperties, "events");

    // Audio widget inside List
    entityExplorer.SelectEntityByName("List1", "Widgets");
    entityExplorer.SelectEntityByName("Container1", "List1");
    entityExplorer.SelectEntityByName("Audio1", "Container1");
    propPane.AssertPropertyVisibility(dataProperties, "data");
    propPane.AssertPropertyVisibility(generalProperties, "general");
    propPane.AssertPropertyVisibility(eventsProperties, "events");

    // Audio recorder widget outside List
    entityExplorer.SelectEntityByName("AudioRecorder2", "Widgets");
    propPane.AssertPropertyVisibility(
      audioRecorderGeneralProperties,
      "general",
    );
    propPane.AssertPropertyVisibility(audioRecorderEventsProperties, "events");

    // Audio recorder widget inside List
    entityExplorer.SelectEntityByName("AudioRecorder1", "Widgets");
    propPane.AssertPropertyVisibility(
      audioRecorderGeneralProperties,
      "general",
    );
    propPane.AssertPropertyVisibility(audioRecorderEventsProperties, "events");

    // Video widget outside List
    entityExplorer.SelectEntityByName("Video2", "Widgets");
    propPane.AssertPropertyVisibility(dataProperties, "data");
    propPane.AssertPropertyVisibility(generalProperties, "general");
    propPane.AssertPropertyVisibility(eventsProperties, "events");

    // Video widget inside List
    entityExplorer.SelectEntityByName("Video1", "Widgets");
    propPane.AssertPropertyVisibility(dataProperties, "data");
    propPane.AssertPropertyVisibility(generalProperties, "general");
    propPane.AssertPropertyVisibility(eventsProperties, "events");
  });

  it("2. Verify auto play", function () {
    entityExplorer.SelectEntityByName("Audio1", "Widgets");
    propPane.TogglePropertyState("autoplay", "On");
    agHelper.AssertAttribute("audio", "autoplay", "autoplay");

    entityExplorer.SelectEntityByName("Video1", "Widgets");
    propPane.TogglePropertyState("autoplay", "On");
    agHelper.AssertAttribute("video", "autoplay", "autoplay");
  });

  it("3. Verify Binding", function () {
    entityExplorer.SelectEntityByName("Text3", "Widgets");
    propPane.UpdatePropertyFieldValue("Text", "{{Audio1.autoPlay}}");
    agHelper.AssertText(locators._textWidgetStyleInDeployed, "text", "true", 2);
    entityExplorer.SelectEntityByName("Audio1", "Widgets");
    propPane.TogglePropertyState("autoplay", "Off");
    agHelper.AssertText(
      locators._textWidgetStyleInDeployed,
      "text",
      "false",
      2,
    );
  });
});
