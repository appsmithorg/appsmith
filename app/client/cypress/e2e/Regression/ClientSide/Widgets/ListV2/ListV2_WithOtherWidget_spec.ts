import {
  agHelper,
  locators,
  entityExplorer,
  propPane,
} from "../../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";

describe(
  "List widget V2 functionality with audio and video widgets",
  { tags: ["@tag.Widget", "@tag.List", "@tag.Binding"] },
  () => {
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

      EditorNavigation.SelectEntityByName("Audio2", EntityType.Widget);
      // Audio widget outside List
      propPane.AssertPropertyVisibility(dataProperties, "data");
      propPane.AssertPropertyVisibility(generalProperties, "general");
      propPane.AssertPropertyVisibility(eventsProperties, "events");

      // Audio widget inside List
      EditorNavigation.SelectEntityByName("Audio1", EntityType.Widget, {}, [
        "List1",
        "Container1",
      ]);
      propPane.AssertPropertyVisibility(dataProperties, "data");
      propPane.AssertPropertyVisibility(generalProperties, "general");
      propPane.AssertPropertyVisibility(eventsProperties, "events");

      // Audio recorder widget outside List
      EditorNavigation.SelectEntityByName("AudioRecorder2", EntityType.Widget);
      propPane.AssertPropertyVisibility(
        audioRecorderGeneralProperties,
        "general",
      );
      propPane.AssertPropertyVisibility(
        audioRecorderEventsProperties,
        "events",
      );

      // Audio recorder widget inside List
      EditorNavigation.SelectEntityByName("AudioRecorder1", EntityType.Widget);
      propPane.AssertPropertyVisibility(
        audioRecorderGeneralProperties,
        "general",
      );
      propPane.AssertPropertyVisibility(
        audioRecorderEventsProperties,
        "events",
      );

      // Video widget outside List
      EditorNavigation.SelectEntityByName("Video2", EntityType.Widget);
      propPane.AssertPropertyVisibility(dataProperties, "data");
      propPane.AssertPropertyVisibility(generalProperties, "general");
      propPane.AssertPropertyVisibility(eventsProperties, "events");

      // Video widget inside List
      EditorNavigation.SelectEntityByName("Video1", EntityType.Widget);
      propPane.AssertPropertyVisibility(dataProperties, "data");
      propPane.AssertPropertyVisibility(generalProperties, "general");
      propPane.AssertPropertyVisibility(eventsProperties, "events");
    });

    it("2. Verify auto play", function () {
      EditorNavigation.SelectEntityByName("Audio1", EntityType.Widget);
      propPane.TogglePropertyState("autoplay", "On");
      agHelper.AssertAttribute("audio", "autoplay", "autoplay");

      EditorNavigation.SelectEntityByName("Video1", EntityType.Widget);
      propPane.TogglePropertyState("autoplay", "On");
      agHelper.AssertAttribute("video", "autoplay", "autoplay");
    });

    it("3. Verify Binding", function () {
      EditorNavigation.SelectEntityByName("Text3", EntityType.Widget);
      propPane.UpdatePropertyFieldValue("Text", "{{Audio1.autoPlay}}");
      agHelper.AssertText(
        locators._textWidgetStyleInDeployed,
        "text",
        "true",
        2,
      );
      EditorNavigation.SelectEntityByName("Audio1", EntityType.Widget);
      propPane.TogglePropertyState("autoplay", "Off");
      agHelper.AssertText(
        locators._textWidgetStyleInDeployed,
        "text",
        "false",
        2,
      );
    });
  },
);
