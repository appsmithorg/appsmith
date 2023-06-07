import * as _ from "../../../../support/Objects/ObjectsCore";

describe("JS to non-JS mode in Action Selector", () => {
  before(() => {
    cy.fixture("promisesBtnDsl").then((val: any) => {
      _.agHelper.AddDsl(val, _.locators._spanButton("Submit"));
    });
  });

  it("1. should show fields appropriately for setinterval", () => {
    _.entityExplorer.SelectEntityByName("Page1", "Pages");
    _.entityExplorer.SelectEntityByName("Button1", "Widgets");

    _.propPane.EnterJSContext("onClick", "{{setInterval()}}", true, false);
    _.jsEditor.DisableJSContext("onClick");

    _.agHelper.GetNAssertElementText(
      _.propPane._actionCard,
      "Set intervalms",
      "have.text",
      0,
    );
    _.agHelper.GetNClick(_.propPane._actionCard, 0);

    _.agHelper.GetNAssertElementText(
      _.propPane._actionPopupTextLabel,
      "Callback function",
      "have.text",
      0,
    );

    _.agHelper.GetNAssertElementText(
      _.propPane._actionPopupTextLabel,
      "Delay (ms)",
      "have.text",
      1,
    );

    _.agHelper.GetNAssertElementText(
      _.propPane._actionPopupTextLabel,
      "Id",
      "have.text",
      2,
    );

    _.propPane.EnterJSContext(
      "onClick",
      "{{setInterval(() => {}, 200, '')}}",
      true,
      false,
    );
    _.jsEditor.DisableJSContext("onClick");

    _.agHelper.GetNAssertElementText(
      _.propPane._actionCard,
      "Set interval200ms",
      "have.text",
      0,
    );
    _.agHelper.GetNClick(_.propPane._actionCard, 0);

    _.propPane.EnterJSContext(
      "onClick",
      "{{setInterval(() => {showAlert('hi')}, 200, 'id1')}}",
      true,
      false,
    );
    _.jsEditor.DisableJSContext("onClick");

    _.agHelper.GetNAssertElementText(
      _.propPane._actionCard,
      "Set interval200ms",
      "have.text",
      0,
    );
    _.agHelper.GetNClick(_.propPane._actionCard, 0);
  });

  it("2. should show fields appropriately for clearInterval", () => {
    _.entityExplorer.SelectEntityByName("Page1", "Pages");
    _.entityExplorer.SelectEntityByName("Button1", "Widgets");

    _.propPane.EnterJSContext("onClick", "{{clearInterval()}}", true, false);
    _.jsEditor.DisableJSContext("onClick");

    _.agHelper.GetNAssertElementText(
      _.propPane._actionCard,
      "Clear intervalAdd Id",
      "have.text",
      0,
    );
    _.agHelper.GetNClick(_.propPane._actionCard, 0);

    _.agHelper.GetNAssertElementText(
      _.propPane._actionPopupTextLabel,
      "Id",
      "have.text",
      0,
    );

    _.propPane.EnterJSContext(
      "onClick",
      "{{clearInterval('Id1')}}",
      true,
      true,
    );
    _.jsEditor.DisableJSContext("onClick");

    _.agHelper.GetNAssertElementText(
      _.propPane._actionCard,
      "Clear intervalId1",
      "have.text",
      0,
    );
    _.agHelper.GetNClick(_.propPane._actionCard, 0);

    _.agHelper.ValidateCodeEditorContent(_.propPane._textView, "Id1");
  });

  it("3. should show no fields for clear store", () => {
    _.entityExplorer.SelectEntityByName("Page1", "Pages");
    _.entityExplorer.SelectEntityByName("Button1", "Widgets");

    _.propPane.EnterJSContext("onClick", "{{clearStore()}}", true, false);
    _.jsEditor.DisableJSContext("onClick");

    _.agHelper.GetNAssertElementText(
      _.propPane._actionCard,
      "Clear store",
      "have.text",
      0,
    );
    _.agHelper.GetNClick(_.propPane._actionCard, 0);

    _.agHelper.AssertElementAbsence(_.propPane._textView);
    _.agHelper.AssertElementAbsence(_.propPane._selectorView);
  });

  it("4. should show no fields for watch geolocation position", () => {
    _.entityExplorer.SelectEntityByName("Page1", "Pages");
    _.entityExplorer.SelectEntityByName("Button1", "Widgets");

    _.propPane.EnterJSContext(
      "onClick",
      "{{appsmith.geolocation.watchPosition()}}",
      true,
      false,
    );
    _.jsEditor.DisableJSContext("onClick");

    _.agHelper.GetNAssertElementText(
      _.propPane._actionCard,
      "Watch geolocation",
      "have.text",
      0,
    );
    _.agHelper.GetNClick(_.propPane._actionCard, 0);

    _.agHelper.AssertElementAbsence(_.propPane._textView);
    _.agHelper.AssertElementAbsence(_.propPane._selectorView);
  });

  it("5. should show no fields for stop watching geolocation position", () => {
    _.entityExplorer.SelectEntityByName("Page1", "Pages");
    _.entityExplorer.SelectEntityByName("Button1", "Widgets");

    _.propPane.EnterJSContext(
      "onClick",
      "{{appsmith.geolocation.clearWatch()}}",
      true,
      false,
    );
    _.jsEditor.DisableJSContext("onClick");

    _.agHelper.GetNAssertElementText(
      _.propPane._actionCard,
      "Stop watching geolocation",
      "have.text",
      0,
    );
    _.agHelper.GetNClick(_.propPane._actionCard, 0);

    _.agHelper.AssertElementAbsence(_.propPane._textView);
    _.agHelper.AssertElementAbsence(_.propPane._selectorView);
  });

  it("6. should show appropriate fields for get geolocation", () => {
    _.entityExplorer.SelectEntityByName("Page1", "Pages");
    _.entityExplorer.SelectEntityByName("Button1", "Widgets");

    _.propPane.EnterJSContext(
      "onClick",
      "{{appsmith.geolocation.getCurrentPosition()}}",
      true,
      false,
    );
    _.jsEditor.DisableJSContext("onClick");

    _.agHelper.GetNAssertElementText(
      _.propPane._actionCard,
      "Get geolocationAdd callback",
      "have.text",
      0,
    );
    _.agHelper.GetNClick(_.propPane._actionCard, 0);

    _.agHelper.GetNAssertElementText(
      _.propPane._actionPopupTextLabel,
      "Callback function",
      "have.text",
      0,
    );

    _.propPane.EnterJSContext(
      "onClick",
      `{{appsmith.geolocation.getCurrentPosition((location) => {
      // add code here
    });}}`,
      true,
      true,
    );
    _.jsEditor.DisableJSContext("onClick");

    _.agHelper.GetNClick(_.propPane._actionCard, 0);

    _.agHelper.GetNAssertElementText(
      _.propPane._actionPopupTextLabel,
      "Callback function",
      "have.text",
      0,
    );
  });

  it("7. should show post message fields appropriately", () => {
    _.entityExplorer.SelectEntityByName("Page1", "Pages");
    _.entityExplorer.SelectEntityByName("Button1", "Widgets");

    _.propPane.EnterJSContext(
      "onClick",
      "{{postWindowMessage()}}",
      true,
      false,
    );
    _.jsEditor.DisableJSContext("onClick");

    _.agHelper.GetNAssertElementText(
      _.propPane._actionCard,
      "Post messageAdd message",
      "have.text",
      0,
    );
    _.agHelper.GetNClick(_.propPane._actionCard, 0);

    _.agHelper.GetNAssertElementText(
      _.propPane._actionPopupTextLabel,
      "Message",
      "have.text",
      0,
    );
    _.agHelper.GetNAssertElementText(
      _.propPane._actionPopupTextLabel,
      "Target iframe",
      "have.text",
      1,
    );
    _.agHelper.GetNAssertElementText(
      _.propPane._actionPopupTextLabel,
      "Allowed origins",
      "have.text",
      2,
    );

    _.propPane.EnterJSContext(
      "onClick",
      "{{postWindowMessage('hello', 'window', '*')}}",
      true,
      false,
    );
    _.jsEditor.DisableJSContext("onClick");

    _.agHelper.GetNAssertElementText(
      _.propPane._actionCard,
      "Post messagehello",
      "have.text",
      0,
    );
    _.agHelper.GetNClick(_.propPane._actionCard, 0);

    _.agHelper.ValidateCodeEditorContent(_.propPane._textView, "hellowindow*");
  });
});
