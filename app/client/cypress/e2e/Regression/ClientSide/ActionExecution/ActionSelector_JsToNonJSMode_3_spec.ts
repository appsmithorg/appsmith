import {
  agHelper,
  locators,
  propPane,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

describe(
  "JS to non-JS mode in Action Selector",
  { tags: ["@tag.JS", "@tag.Binding"] },
  () => {
    before(() => {
      agHelper.AddDsl("promisesBtnDsl", locators._buttonByText("Submit"));
    });

    it("1. should show fields appropriately for setinterval", () => {
      EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);

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
      EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);

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

      propPane.EnterJSContext(
        "onClick",
        "{{clearInterval('Id1')}}",
        true,
        true,
      );
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
      EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);

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
      EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);

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
      EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);

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
      EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);

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
      EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);

      propPane.EnterJSContext(
        "onClick",
        "{{postWindowMessage()}}",
        true,
        false,
      );
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
        propPane._windowTargetDropdown,
        "Window",
        "have.text",
        0,
      );
      agHelper.GetNAssertElementText(
        propPane._actionPopupTextLabel,
        "Allowed origins",
        "have.text",
        1,
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
  },
);
