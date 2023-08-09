import {
  agHelper,
  draggableWidgets,
  entityExplorer,
  deployMode,
  propPane,
  locators,
} from "../../../../../support/Objects/ObjectsCore";

describe("Audio Recorder functionality tests", () => {
  before(() => {
    entityExplorer.DragDropWidgetNVerify(
      draggableWidgets.AUDIORECORDER,
      200,
      200,
    );
  });
  it("1. Verify properties and sub events are present and js convertible", () => {
    entityExplorer.SelectEntityByName("AudioRecorder1", "Widgets");
    // assert properteis are present
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
    agHelper.AssertElementExist(locators._existingFieldTextByName("Disabled"));
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
    entityExplorer.SelectEntityByName("AudioRecorder1", "Widgets");
    propPane.TogglePropertyState("Visible", "On");
    // verify recorder is disabled
    propPane.TogglePropertyState("Disabled", "On");
    agHelper.AssertElementEnabledDisabled(
      "//button[@status='PERMISSION_PROMPT']",
    );
    deployMode.DeployApp();
    agHelper.Sleep(2000);
    agHelper.AssertElementEnabledDisabled(
      "//button[@status='PERMISSION_PROMPT']",
    );
    deployMode.NavigateBacktoEditor();
    // verify in preview mode
    agHelper.GetNClick(locators._enterPreviewMode);
    //verify widget is disabled
    agHelper.AssertElementEnabledDisabled(
      "//button[@status='PERMISSION_PROMPT']",
    );
    //Exit preview mode
    agHelper.GetNClick(locators._exitPreviewMode);
  });

  it("3. Verify onRecordingStart and onRecordingStart Events", () => {
    entityExplorer.SelectEntityByName("AudioRecorder1", "Widgets");
    propPane.TogglePropertyState("Disabled", "Off");
    propPane.SelectPlatformFunction("onRecordingStart", "Show alert");
    agHelper.EnterActionValue("Message", "Recording Started");
    propPane.SelectPlatformFunction("onRecordingComplete", "Show alert");
    agHelper.EnterActionValue("Message", "Recording Completed");
    agHelper.GetNClick(".bp3-button");
    agHelper.GetNClick(".bp3-button");
    agHelper.ValidateToastMessage("Recording Started");
    agHelper.WaitUntilAllToastsDisappear();
    agHelper.Sleep(2000); //for recorder to record
    agHelper.GetNClick(".bp3-minimal");
    agHelper.ValidateToastMessage("Recording Completed");
    // verify in deploy mode
    deployMode.DeployApp();
    agHelper.Sleep(2000);
    cy.xpath("//button[@status='PERMISSION_PROMPT']").click();
    cy.xpath("//button[@status='DEFAULT']").click();

    agHelper.ValidateToastMessage("Recording Started");
    agHelper.WaitUntilAllToastsDisappear();
    agHelper.GetNClick(".bp3-minimal");
    agHelper.ValidateToastMessage("Recording Completed");
    agHelper.WaitUntilAllToastsDisappear();
    deployMode.NavigateBacktoEditor();
    // verify in preview mode
    agHelper.GetNClick(locators._enterPreviewMode);
    cy.xpath("//button[@status='PERMISSION_PROMPT']").click();
    cy.xpath("//button[@status='DEFAULT']").click();
    agHelper.ValidateToastMessage("Recording Started");
    agHelper.WaitUntilAllToastsDisappear();
    agHelper.GetNClick(".bp3-minimal");
    agHelper.ValidateToastMessage("Recording Completed");
    //Exit preview mode
    agHelper.GetNClick(locators._exitPreviewMode);
  });

  it("Verify style tab's proprties", () => {
    entityExplorer.SelectEntityByName("AudioRecorder1", "Widgets");
    propPane.MoveToTab("Style");
    propPane.EnterJSContext("Button color", "#FFC13D");
    agHelper.Sleep(1000);
    propPane.SelectColorFromColorPicker("iconcolor", -15);
    cy.xpath("//button[@status='COMPLETE']").should(
      "have.css",
      "background-color",
      "rgb(255, 193, 61)",
    );
    propPane.EnterJSContext("Box shadow", "Small");
    cy.xpath("//button[@status='COMPLETE']")
      .should("have.css", "box-shadow")
      .and("not.eq", "none");
    propPane.EnterJSContext("Border radius", "none");
    cy.xpath("//button[@status='COMPLETE']")
      .should("have.css", "border-radius")
      .and("eq", "3px");
  });
});
