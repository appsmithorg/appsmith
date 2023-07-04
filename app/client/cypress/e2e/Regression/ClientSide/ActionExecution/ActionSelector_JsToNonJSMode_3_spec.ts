import {
  agHelper,
  locators,
  entityExplorer,
  propPane,
} from "../../../../support/Objects/ObjectsCore";

describe("JS to non-JS mode in Action Selector", () => {
  before(() => {
    agHelper.AddDsl("promisesBtnDsl", locators._spanButton("Submit"));
  });

  it("1. should show fields appropriately for setinterval", () => {
    entityExplorer.SelectEntityByName("Page1", "Pages");
    entityExplorer.SelectEntityByName("Button1", "Widgets");

    propPane.EnterJSContext("onClick", "{{setInterval()}}", true, false);
    propPane.ToggleJSMode("onClick", false);

    agHelper.GetNAssertElementText(
      propPane._actionCard,
      "Set intervalms",
      "have.text",
      0,
    );
    agHelper.GetNClick(propPane._actionCard, 0);

    agHelper.GetNAssertElementText(
      propPane._actionPopupTextLabel,
      "Callback function",
      "have.text",
      0,
    );

    agHelper.GetNAssertElementText(
      propPane._actionPopupTextLabel,
      "Delay (ms)",
      "have.text",
      1,
    );

    agHelper.GetNAssertElementText(
      propPane._actionPopupTextLabel,
      "Id",
      "have.text",
      2,
    );

    propPane.EnterJSContext(
      "onClick",
      "{{setInterval(() => {}, 200, '')}}",
      true,
      false,
    );
    propPane.ToggleJSMode("onClick", false);

    agHelper.GetNAssertElementText(
      propPane._actionCard,
      "Set interval200ms",
      "have.text",
      0,
    );
    agHelper.GetNClick(propPane._actionCard, 0);

    propPane.EnterJSContext(
      "onClick",
      "{{setInterval(() => {showAlert('hi')}, 200, 'id1')}}",
      true,
      false,
    );
    propPane.ToggleJSMode("onClick", false);

    agHelper.GetNAssertElementText(
      propPane._actionCard,
      "Set interval200ms",
      "have.text",
      0,
    );
    agHelper.GetNClick(propPane._actionCard, 0);
  });

  it("2. should show fields appropriately for clearInterval", () => {
    entityExplorer.SelectEntityByName("Page1", "Pages");
    entityExplorer.SelectEntityByName("Button1", "Widgets");

    propPane.EnterJSContext("onClick", "{{clearInterval()}}", true, false);
    propPane.ToggleJSMode("onClick", false);

    agHelper.GetNAssertElementText(
      propPane._actionCard,
      "Clear intervalAdd Id",
      "have.text",
      0,
    );
    agHelper.GetNClick(propPane._actionCard, 0);

    agHelper.GetNAssertElementText(
      propPane._actionPopupTextLabel,
      "Id",
      "have.text",
      0,
    );

    propPane.EnterJSContext("onClick", "{{clearInterval('Id1')}}", true, true);
    propPane.ToggleJSMode("onClick", false);

    agHelper.GetNAssertElementText(
      propPane._actionCard,
      "Clear intervalId1",
      "have.text",
      0,
    );
    agHelper.GetNClick(propPane._actionCard, 0);

    agHelper.ValidateCodeEditorContent(propPane._textView, "Id1");
  });

  it("3. should show no fields for clear store", () => {
    entityExplorer.SelectEntityByName("Page1", "Pages");
    entityExplorer.SelectEntityByName("Button1", "Widgets");

    propPane.EnterJSContext("onClick", "{{clearStore()}}", true, false);
    propPane.ToggleJSMode("onClick", false);

    agHelper.GetNAssertElementText(
      propPane._actionCard,
      "Clear store",
      "have.text",
      0,
    );
    agHelper.GetNClick(propPane._actionCard, 0);

    agHelper.AssertElementAbsence(propPane._textView);
    agHelper.AssertElementAbsence(propPane._selectorView);
  });

  it("4. should show no fields for watch geolocation position", () => {
    entityExplorer.SelectEntityByName("Page1", "Pages");
    entityExplorer.SelectEntityByName("Button1", "Widgets");

    propPane.EnterJSContext(
      "onClick",
      "{{appsmith.geolocation.watchPosition()}}",
      true,
      false,
    );
    propPane.ToggleJSMode("onClick", false);

    agHelper.GetNAssertElementText(
      propPane._actionCard,
      "Watch geolocation",
      "have.text",
      0,
    );
    agHelper.GetNClick(propPane._actionCard, 0);

    agHelper.AssertElementAbsence(propPane._textView);
    agHelper.AssertElementAbsence(propPane._selectorView);
  });

  it("5. should show no fields for stop watching geolocation position", () => {
    entityExplorer.SelectEntityByName("Page1", "Pages");
    entityExplorer.SelectEntityByName("Button1", "Widgets");

    propPane.EnterJSContext(
      "onClick",
      "{{appsmith.geolocation.clearWatch()}}",
      true,
      false,
    );
    propPane.ToggleJSMode("onClick", false);

    agHelper.GetNAssertElementText(
      propPane._actionCard,
      "Stop watching geolocation",
      "have.text",
      0,
    );
    agHelper.GetNClick(propPane._actionCard, 0);

    agHelper.AssertElementAbsence(propPane._textView);
    agHelper.AssertElementAbsence(propPane._selectorView);
  });

  it("6. should show appropriate fields for get geolocation", () => {
    entityExplorer.SelectEntityByName("Page1", "Pages");
    entityExplorer.SelectEntityByName("Button1", "Widgets");

    propPane.EnterJSContext(
      "onClick",
      "{{appsmith.geolocation.getCurrentPosition()}}",
      true,
      false,
    );
    propPane.ToggleJSMode("onClick", false);

    agHelper.GetNAssertElementText(
      propPane._actionCard,
      "Get geolocationAdd callback",
      "have.text",
      0,
    );
    agHelper.GetNClick(propPane._actionCard, 0);

    agHelper.GetNAssertElementText(
      propPane._actionPopupTextLabel,
      "Callback function",
      "have.text",
      0,
    );

    propPane.EnterJSContext(
      "onClick",
      `{{appsmith.geolocation.getCurrentPosition((location) => {
      // add code here
    });}}`,
      true,
      true,
    );
    propPane.ToggleJSMode("onClick", false);

    agHelper.GetNClick(propPane._actionCard, 0);

    agHelper.GetNAssertElementText(
      propPane._actionPopupTextLabel,
      "Callback function",
      "have.text",
      0,
    );
  });

  it("7. should show post message fields appropriately", () => {
    entityExplorer.SelectEntityByName("Page1", "Pages");
    entityExplorer.SelectEntityByName("Button1", "Widgets");

    propPane.EnterJSContext("onClick", "{{postWindowMessage()}}", true, false);
    propPane.ToggleJSMode("onClick", false);

    agHelper.GetNAssertElementText(
      propPane._actionCard,
      "Post messageAdd message",
      "have.text",
      0,
    );
    agHelper.GetNClick(propPane._actionCard, 0);

    agHelper.GetNAssertElementText(
      propPane._actionPopupTextLabel,
      "Message",
      "have.text",
      0,
    );
    agHelper.GetNAssertElementText(
      propPane._actionPopupTextLabel,
      "Target iframe",
      "have.text",
      1,
    );
    agHelper.GetNAssertElementText(
      propPane._actionPopupTextLabel,
      "Allowed origins",
      "have.text",
      2,
    );

    propPane.EnterJSContext(
      "onClick",
      "{{postWindowMessage('hello', 'window', '*')}}",
      true,
      false,
    );
    propPane.ToggleJSMode("onClick", false);

    agHelper.GetNAssertElementText(
      propPane._actionCard,
      "Post messagehello",
      "have.text",
      0,
    );
    agHelper.GetNClick(propPane._actionCard, 0);

    agHelper.ValidateCodeEditorContent(propPane._textView, "hellowindow*");
  });
});
