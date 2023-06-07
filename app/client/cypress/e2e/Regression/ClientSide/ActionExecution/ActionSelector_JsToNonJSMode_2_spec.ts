import * as _ from "../../../../support/Objects/ObjectsCore";

describe("JS to non-JS mode in Action Selector", () => {
  before(() => {
    cy.fixture("promisesBtnDsl").then((val: any) => {
      _.agHelper.AddDsl(val, _.locators._spanButton("Submit"));
    });
  });

  it("1. shows fields for navigate to from js to non-js mode", () => {
    _.entityExplorer.SelectEntityByName("Page1", "Pages");
    _.entityExplorer.SelectEntityByName("Button1", "Widgets");

    _.propPane.EnterJSContext("onClick", "{{navigateTo()}}", true, false);
    _.jsEditor.DisableJSContext("onClick");

    _.agHelper.GetNAssertElementText(
      _.propPane._actionCard,
      "Navigate toSelect page",
      "have.text",
      0,
    );
    _.agHelper.GetNClick(_.propPane._actionCard, 0);

    _.agHelper.AssertElementVisible(_.propPane._navigateToType("Page name"));

    _.agHelper.GetNAssertElementText(
      _.propPane._actionOpenDropdownSelectPage,
      "Select page",
      "have.text",
      0,
    );

    _.agHelper.GetNAssertElementText(
      _.propPane._actionPopupTextLabel,
      "Query params",
      "have.text",
      0,
    );

    _.agHelper.GetNAssertElementText(
      _.propPane._sameWindowDropdownOption,
      "Same window",
      "have.text",
      0,
    );

    _.propPane.EnterJSContext(
      "onClick",
      "{{navigateTo('Page1', {a:1}, 'NEW_WINDOW')}}",
      true,
      true,
    );
    _.jsEditor.DisableJSContext("onClick");

    _.agHelper.GetNAssertElementText(
      _.propPane._actionCard,
      "Navigate toPage1",
      "have.text",
      0,
    );
    _.agHelper.GetNClick(_.propPane._actionCard, 0);

    _.agHelper.AssertElementVisible(_.propPane._navigateToType("Page name"));

    _.agHelper.GetNAssertElementText(
      _.propPane._actionOpenDropdownSelectPage,
      "Page1",
      "have.text",
      0,
    );

    _.agHelper.GetNAssertElementText(
      _.propPane._actionPopupTextLabel,
      "Query params",
      "have.text",
      0,
    );

    _.agHelper.GetNAssertElementText(
      _.propPane._sameWindowDropdownOption,
      "New window",
      "have.text",
      0,
    );

    _.propPane.EnterJSContext(
      "onClick",
      "{{navigateTo('google.com', {a:1}, 'SAME_WINDOW')}}",
      true,
      true,
    );
    _.jsEditor.DisableJSContext("onClick");

    _.agHelper.GetNAssertElementText(
      _.propPane._actionCard,
      "Navigate togoogle.com",
      "have.text",
      0,
    );
    _.agHelper.GetNClick(_.propPane._actionCard, 0);

    _.agHelper.AssertElementVisible(_.propPane._navigateToType("URL"));

    _.agHelper.GetNAssertElementText(
      _.propPane._actionPopupTextLabel,
      "Enter URL",
      "have.text",
      0,
    );

    _.agHelper.GetNAssertElementText(
      _.propPane._actionPopupTextLabel,
      "Query params",
      "have.text",
      1,
    );

    _.agHelper.GetNAssertElementText(
      _.propPane._sameWindowDropdownOption,
      "Same window",
      "have.text",
      0,
    );
  });

  it("2. shows fields for show alert from js to non-js mode", () => {
    _.entityExplorer.SelectEntityByName("Page1", "Pages");
    _.entityExplorer.SelectEntityByName("Button1", "Widgets");

    _.propPane.EnterJSContext("onClick", "{{showAlert()}}", true, false);
    _.jsEditor.DisableJSContext("onClick");

    _.agHelper.GetNAssertElementText(
      _.propPane._actionCard,
      "Show alertAdd message",
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
      _.propPane._dropdownSelectType,
      "Select type",
      "have.text",
      0,
    );

    _.propPane.EnterJSContext(
      "onClick",
      "{{showAlert('hello', 'info')}}",
      true,
      false,
    );
    _.jsEditor.DisableJSContext("onClick");

    _.agHelper.GetNAssertElementText(
      _.propPane._actionCard,
      "Show alerthello",
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
    _.agHelper.ValidateCodeEditorContent(_.propPane._textView, "hello");

    _.agHelper.GetNAssertElementText(
      _.propPane._dropdownSelectType,
      "Info",
      "have.text",
      0,
    );
  });

  it("3. shows fields for show modal from js to non-js mode", () => {
    _.entityExplorer.SelectEntityByName("Page1", "Pages");

    _.entityExplorer.DragDropWidgetNVerify("modalwidget", 50, 50);
    _.entityExplorer.SelectEntityByName("Button1", "Widgets");

    _.propPane.EnterJSContext("onClick", "{{showModal()}}", true, false);
    _.jsEditor.DisableJSContext("onClick");

    _.agHelper.GetNAssertElementText(
      _.propPane._actionCard,
      "Show modalnone",
      "have.text",
      0,
    );
    _.agHelper.GetNClick(_.propPane._actionCard, 0);

    _.agHelper.GetNAssertElementText(
      _.propPane._actionOpenDropdownSelectModal,
      "Select modal",
      "have.text",
      0,
    );

    _.propPane.EnterJSContext(
      "onClick",
      "{{showModal('Modal1')}}",
      true,
      false,
    );
    _.jsEditor.DisableJSContext("onClick");

    _.agHelper.GetNAssertElementText(
      _.propPane._actionCard,
      "Show modalModal1",
      "have.text",
      0,
    );
    _.agHelper.GetNClick(_.propPane._actionCard, 0);

    _.agHelper.GetNAssertElementText(
      _.propPane._actionOpenDropdownSelectModal,
      "Modal1",
      "have.text",
      0,
    );
  });

  it("4. shows fields for remove modal from js to non-js mode", () => {
    _.entityExplorer.SelectEntityByName("Page1", "Pages");
    _.entityExplorer.SelectEntityByName("Button1", "Widgets");

    _.propPane.EnterJSContext("onClick", "{{closeModal()}}", true, false);
    _.jsEditor.DisableJSContext("onClick");

    _.agHelper.GetNAssertElementText(
      _.propPane._actionCard,
      "Close modalnone",
      "have.text",
      0,
    );
    _.agHelper.GetNClick(_.propPane._actionCard, 0);

    _.agHelper.GetNAssertElementText(
      _.propPane._actionOpenDropdownSelectModal,
      "Select modal",
      "have.text",
      0,
    );

    _.propPane.EnterJSContext(
      "onClick",
      "{{closeModal('Modal1')}}",
      true,
      false,
    );
    _.jsEditor.DisableJSContext("onClick");

    _.agHelper.GetNAssertElementText(
      _.propPane._actionCard,
      "Close modalModal1",
      "have.text",
      0,
    );
    _.agHelper.GetNClick(_.propPane._actionCard, 0);

    _.agHelper.GetNAssertElementText(
      _.propPane._actionOpenDropdownSelectModal,
      "Modal1",
      "have.text",
      0,
    );
  });

  it("5. should shows appropriate fields for store value", () => {
    _.entityExplorer.SelectEntityByName("Page1", "Pages");
    _.entityExplorer.SelectEntityByName("Button1", "Widgets");

    _.propPane.EnterJSContext("onClick", "{{storeValue()}}", true, false);
    _.jsEditor.DisableJSContext("onClick");

    _.agHelper.GetNAssertElementText(
      _.propPane._actionCard,
      "Store valueAdd key",
      "have.text",
      0,
    );
    _.agHelper.GetNClick(_.propPane._actionCard, 0);

    _.agHelper.GetNAssertElementText(
      _.propPane._actionPopupTextLabel,
      "Key",
      "have.text",
      0,
    );
    _.agHelper.GetNAssertElementText(
      _.propPane._actionPopupTextLabel,
      "Value",
      "have.text",
      1,
    );

    _.propPane.EnterJSContext(
      "onClick",
      "{{storeValue('a', '')}}",
      true,
      false,
    );
    _.jsEditor.DisableJSContext("onClick");

    _.agHelper.GetNAssertElementText(
      _.propPane._actionCard,
      "Store valuea",
      "have.text",
      0,
    );
    _.agHelper.GetNClick(_.propPane._actionCard, 0);

    _.propPane.EnterJSContext("onClick", "{{storeValue('a', 1)}}", true, false);
    _.jsEditor.DisableJSContext("onClick");

    _.agHelper.GetNAssertElementText(
      _.propPane._actionCard,
      "Store valuea",
      "have.text",
      0,
    );
    _.agHelper.GetNClick(_.propPane._actionCard, 0);

    _.agHelper.ValidateCodeEditorContent(_.propPane._textView, "a{{1}}");

    _.propPane.EnterJSContext("onClick", "{{storeValue('', 1)}}", true, false);
    _.jsEditor.DisableJSContext("onClick");

    _.agHelper.GetNAssertElementText(
      _.propPane._actionCard,
      "Store valueAdd key",
      "have.text",
      0,
    );
    _.agHelper.GetNClick(_.propPane._actionCard, 0);
  });

  it("6. shows fields for remove value appropriately", () => {
    _.entityExplorer.SelectEntityByName("Page1", "Pages");
    _.entityExplorer.SelectEntityByName("Button1", "Widgets");

    _.propPane.EnterJSContext("onClick", "{{removeValue()}}", true, false);
    _.jsEditor.DisableJSContext("onClick");

    _.agHelper.GetNAssertElementText(
      _.propPane._actionCard,
      "Remove valueAdd key",
      "have.text",
      0,
    );
    _.agHelper.GetNClick(_.propPane._actionCard, 0);

    _.agHelper.GetNAssertElementText(
      _.propPane._actionPopupTextLabel,
      "Key",
      "have.text",
      0,
    );

    _.propPane.EnterJSContext("onClick", "{{removeValue('a')}}", true, false);
    _.jsEditor.DisableJSContext("onClick");

    _.agHelper.GetNAssertElementText(
      _.propPane._actionCard,
      "Remove valuea",
      "have.text",
      0,
    );
    _.agHelper.GetNClick(_.propPane._actionCard, 0);

    _.agHelper.ValidateCodeEditorContent(_.propPane._textView, "a");
  });

  it("7. shows fields appropriately for the download function", () => {
    _.entityExplorer.SelectEntityByName("Page1", "Pages");
    _.entityExplorer.SelectEntityByName("Button1", "Widgets");

    _.propPane.EnterJSContext("onClick", "{{download()}}", true, false);
    _.jsEditor.DisableJSContext("onClick");

    _.agHelper.GetNAssertElementText(
      _.propPane._actionCard,
      "DownloadAdd data to download",
      "have.text",
      0,
    );
    _.agHelper.GetNClick(_.propPane._actionCard, 0);

    _.agHelper.GetNAssertElementText(
      _.propPane._actionPopupTextLabel,
      "Data to download",
      "have.text",
      0,
    );
    _.agHelper.GetNAssertElementText(
      _.propPane._actionPopupTextLabel,
      "File name with extension",
      "have.text",
      1,
    );
    _.agHelper.GetNAssertElementText(
      _.propPane._selectorViewLabel,
      "Type",
      "have.text",
      0,
    );

    _.agHelper.GetNAssertElementText(
      _.propPane._selectorViewButton,
      "Select file type (optional)",
    );

    _.propPane.EnterJSContext(
      "onClick",
      "{{download('a', '', '')}}",
      true,
      false,
    );
    _.jsEditor.DisableJSContext("onClick");

    _.agHelper.GetNAssertElementText(
      _.propPane._actionCard,
      "DownloadAdd data to download",
      "have.text",
      0,
    );

    _.propPane.EnterJSContext(
      "onClick",
      "{{download('a', 'b', '')}}",
      true,
      false,
    );
    _.jsEditor.DisableJSContext("onClick");

    _.agHelper.GetNAssertElementText(
      _.propPane._actionCard,
      "Downloadb",
      "have.text",
      0,
    );

    _.propPane.EnterJSContext(
      "onClick",
      "{{download('a', 'b', 'image/png')}}",
      true,
      false,
    );
    _.jsEditor.DisableJSContext("onClick");

    _.agHelper.GetNAssertElementText(
      _.propPane._actionCard,
      "Downloadb",
      "have.text",
      0,
    );
    _.agHelper.GetNClick(_.propPane._actionCard, 0);
    _.agHelper.ValidateCodeEditorContent(_.propPane._textView, "ab");

    _.agHelper.GetNAssertElementText(
      _.propPane._selectorViewButton,
      "PNG",
      "have.text",
      0,
    );
  });

  it("8. shows fields for copyToClipboard appropriately", () => {
    _.entityExplorer.SelectEntityByName("Page1", "Pages");
    _.entityExplorer.SelectEntityByName("Button1", "Widgets");

    _.propPane.EnterJSContext("onClick", "{{copyToClipboard()}}", true, false);
    _.jsEditor.DisableJSContext("onClick");

    _.agHelper.GetNAssertElementText(
      _.propPane._actionCard,
      "Copy to clipboardAdd text",
      "have.text",
      0,
    );
    _.agHelper.GetNClick(_.propPane._actionCard, 0);

    _.agHelper.GetNAssertElementText(
      _.propPane._actionPopupTextLabel,
      "Text to be copied to clipboard",
      "have.text",
      0,
    );

    _.propPane.EnterJSContext(
      "onClick",
      "{{copyToClipboard('a')}}",
      true,
      false,
    );
    _.jsEditor.DisableJSContext("onClick");

    _.agHelper.GetNAssertElementText(
      _.propPane._actionCard,
      "Copy to clipboarda",
      "have.text",
      0,
    );
    _.agHelper.GetNClick(_.propPane._actionCard, 0);

    _.agHelper.ValidateCodeEditorContent(_.propPane._textView, "a");
    _.agHelper.TypeText(
      _.propPane._actionSelectorFieldByLabel("Text to be copied to clipboard"),
      "line1{enter}line2{enter}line3",
      0,
      true,
    );
    _.jsEditor.EnableJSContext("onClick");
    _.propPane.ValidatePropertyFieldValue(
      "onClick",
      `{{copyToClipboard('line1\\nline2\\nline3a');}}`,
    );
  });

  it("9. shows fields for reset widget appropriately", () => {
    _.entityExplorer.SelectEntityByName("Page1", "Pages");
    _.entityExplorer.SelectEntityByName("Button1", "Widgets");

    _.propPane.EnterJSContext("onClick", "{{resetWidget()}}", true, false);
    _.jsEditor.DisableJSContext("onClick");

    _.agHelper.GetNAssertElementText(
      _.propPane._actionCard,
      "Reset widgetSelect widget",
      "have.text",
      0,
    );
    _.agHelper.GetNClick(_.propPane._actionCard, 0);

    _.agHelper.GetNAssertElementText(
      _.propPane._selectorViewLabel,
      "Widget",
      "have.text",
      0,
    );

    _.agHelper.GetNAssertElementText(
      _.propPane._selectorViewLabel,
      "Reset Children",
      "have.text",
      1,
    );

    _.agHelper.GetNAssertElementText(
      _.propPane._selectorViewButton,
      "Select widget",
      "have.text",
      0,
    );

    _.agHelper.GetNAssertElementText(
      _.propPane._selectorViewButton,
      "true",
      "have.text",
      1,
    );

    _.propPane.EnterJSContext(
      "onClick",
      '{{resetWidget("Modal1", false)}}',
      true,
      false,
    );
    _.jsEditor.DisableJSContext("onClick");

    _.agHelper.GetNAssertElementText(
      _.propPane._actionCard,
      "Reset widgetModal1",
      "have.text",
      0,
    );
    _.agHelper.GetNClick(_.propPane._actionCard, 0);

    _.agHelper.GetNAssertElementText(
      _.propPane._selectorViewButton,
      "Modal1",
      "have.text",
      0,
    );

    _.agHelper.GetNAssertElementText(
      _.propPane._selectorViewButton,
      "false",
      "have.text",
      1,
    );

    _.propPane.EnterJSContext(
      "onClick",
      '{{resetWidget("Modal1")}}',
      true,
      false,
    );
    _.jsEditor.DisableJSContext("onClick");

    _.agHelper.GetNAssertElementText(
      _.propPane._actionCard,
      "Reset widgetModal1",
      "have.text",
      0,
    );
    _.agHelper.GetNClick(_.propPane._actionCard, 0);

    _.agHelper.GetNAssertElementText(
      _.propPane._selectorViewButton,
      "Modal1",
      "have.text",
      0,
    );

    _.agHelper.GetNAssertElementText(
      _.propPane._selectorViewButton,
      "true",
      "have.text",
      1,
    );

    _.propPane.EnterJSContext(
      "onClick",
      "{{resetWidget('', false)}}",
      true,
      false,
    );
    _.jsEditor.DisableJSContext("onClick");

    _.agHelper.GetNAssertElementText(
      _.propPane._actionCard,
      "Reset widgetSelect widget",
      "have.text",
      0,
    );
    _.agHelper.GetNClick(_.propPane._actionCard, 0);

    _.agHelper.GetNAssertElementText(
      _.propPane._selectorViewButton,
      "Select widget",
      "have.text",
      0,
    );

    _.agHelper.GetNAssertElementText(
      _.propPane._selectorViewButton,
      "false",
      "have.text",
      1,
    );
  });

  it("10. should show fields appropriately for setinterval", () => {
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

  it("11. should show fields appropriately for clearInterval", () => {
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

  it("12. should show no fields for clear store", () => {
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

  it("13. should show no fields for watch geolocation position", () => {
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

  it("14. should show no fields for stop watching geolocation position", () => {
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

  it("15. should show appropriate fields for get geolocation", () => {
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

  it("16. should show post message fields appropriately", () => {
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
