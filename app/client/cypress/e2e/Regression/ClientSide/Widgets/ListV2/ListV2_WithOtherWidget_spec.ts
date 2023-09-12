import {
  agHelper,
  locators,
  entityExplorer,
  draggableWidgets,
  deployMode,
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

describe("List widget V2 functionality with button, button group and icon button widgets", () => {
  before(() => {
    agHelper.AddDsl("listV2ButtonsDsl");
    entityExplorer.DragDropWidgetNVerify("buttonwidget", 500, 500);
    entityExplorer.DragDropWidgetNVerify("buttongroupwidget", 500, 600);
    entityExplorer.DragDropWidgetNVerify("iconbuttonwidget", 500, 700);
  });

  it("1. Verify property visibility", () => {
    const basicProperties = ["label", "onclick"];

    const generalProperties1 = ["visible", "disabled", "animateloading"];

    const formSettingsProperties = [
      "disabledinvalidforms",
      "resetformonsuccess",
    ];

    const buttonGroupDataProperties = ["buttons"];

    const buttonGroupGeneralProperties = [
      "visible",
      "disabled",
      "animateloading",
    ];

    const iconButtonbasicProperties = ["icon", "onclick"];

    // Button widget outside List
    entityExplorer.SelectEntityByName("Button2", "Widgets");
    propPane.AssertPropertyVisibility(basicProperties, "basic");
    propPane.AssertPropertyVisibility(generalProperties1, "general");
    propPane.AssertPropertyVisibility(formSettingsProperties, "formsettings");

    // Button widget inside List
    entityExplorer.SelectEntityByName("List1", "Widgets");
    entityExplorer.SelectEntityByName("Container1", "List1");
    entityExplorer.SelectEntityByName("Button1", "Container1");
    propPane.AssertPropertyVisibility(basicProperties, "basic");
    propPane.AssertPropertyVisibility(generalProperties1, "general");
    propPane.AssertPropertyVisibility(formSettingsProperties, "formsettings");

    entityExplorer.SelectEntityByName("ButtonGroup2", "Widgets");
    // Button group widget outside List
    propPane.AssertPropertyVisibility(buttonGroupDataProperties, "data");
    propPane.AssertPropertyVisibility(buttonGroupGeneralProperties, "general");

    // Button group widget inside List
    entityExplorer.SelectEntityByName("ButtonGroup1", "Widgets");
    propPane.AssertPropertyVisibility(buttonGroupDataProperties, "data");
    propPane.AssertPropertyVisibility(buttonGroupGeneralProperties, "general");

    // Icon Button widget outside List
    entityExplorer.SelectEntityByName("IconButton2", "Widgets");
    propPane.AssertPropertyVisibility(iconButtonbasicProperties, "basic");
    propPane.AssertPropertyVisibility(buttonGroupGeneralProperties, "general");

    // Icon Button widget inside List
    entityExplorer.SelectEntityByName("IconButton1", "Widgets");
    propPane.AssertPropertyVisibility(iconButtonbasicProperties, "basic");
    propPane.AssertPropertyVisibility(buttonGroupGeneralProperties, "general");
  });

  it("2. Verify onClick functionality", () => {
    // Button
    entityExplorer.SelectEntityByName("Button1", "Widgets");
    propPane.SelectPlatformFunction("onClick", "Show alert");
    agHelper.TypeText(
      propPane._actionSelectorFieldByLabel("Message"),
      "Button Clicked",
    );
    agHelper.GetNClick(propPane._actionSelectorPopupClose);
    agHelper.GetNClick(locators._widgetInDeployed("buttonwidget"));
    agHelper.ValidateToastMessage("Button Clicked");

    // Icon Button
    entityExplorer.SelectEntityByName("IconButton1", "Widgets");
    propPane.SelectPlatformFunction("onClick", "Show alert");
    agHelper.TypeText(
      propPane._actionSelectorFieldByLabel("Message"),
      "Icon Button Clicked",
    );
    agHelper.GetNClick(propPane._actionSelectorPopupClose);
    agHelper.GetNClick(locators._widgetInDeployed("iconbuttonwidget"));
    agHelper.ValidateToastMessage("Icon Button Clicked");

    // Preview mode
    agHelper.GetNClick(locators._enterPreviewMode);
    agHelper.GetNClick(locators._widgetInDeployed("buttonwidget"));
    agHelper.WaitUntilToastDisappear("Button Clicked");
    agHelper.GetNClick(locators._widgetInDeployed("iconbuttonwidget"));
    agHelper.ValidateToastMessage("Icon Button Clicked");
    agHelper.GetNClick(locators._exitPreviewMode);

    // Deploy mode
    deployMode.DeployApp();
    agHelper.GetNClick(locators._widgetInDeployed("buttonwidget"));
    agHelper.WaitUntilToastDisappear("Button Clicked");
    agHelper.GetNClick(locators._widgetInDeployed("iconbuttonwidget"));
    agHelper.ValidateToastMessage("Icon Button Clicked");
    deployMode.NavigateBacktoEditor();
  });

  it("3. Verify Styles should be configured individually", () => {
    entityExplorer.SelectEntityByName("List1", "Widgets");
    entityExplorer.SelectEntityByName("Container1", "List1");
    entityExplorer.SelectEntityByName("Button1", "Container1");
    propPane.MoveToTab("Style");
    agHelper.AssertAttribute("[data-value='PRIMARY']", "data-selected", "true");
    agHelper.GetNClick("[data-value='SECONDARY']");
    agHelper.AssertAttribute(
      "[data-value='PRIMARY']",
      "data-selected",
      "false",
    );

    entityExplorer.SelectEntityByName("IconButton1", "Widgets");
    propPane.MoveToTab("Style");
    agHelper.AssertAttribute("[data-value='PRIMARY']", "data-selected", "true");

    entityExplorer.SelectEntityByName("ButtonGroup1", "Widgets");
    propPane.MoveToTab("Style");
    agHelper.AssertAttribute("[data-value='PRIMARY']", "data-selected", "true");
  });
});
