import {
  agHelper,
  draggableWidgets,
  entityExplorer,
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
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.BUTTON);
    });

    it("1. shows fields for navigate to from js to non-js mode", () => {
      propPane.EnterJSContext("onClick", "{{navigateTo()}}", true, false);
      propPane.ToggleJSMode("onClick", false);

      agHelper.GetNAssertElementText(
        propPane._actionCard,
        "Navigate toSelect page",
        "have.text",
        0,
      );
      agHelper.GetNClick(propPane._actionCard, 0);

      agHelper.AssertElementVisibility(propPane._navigateToType("Page name"));

      agHelper.GetNAssertElementText(
        propPane._actionOpenDropdownSelectPage,
        "Select page",
        "have.text",
        0,
      );

      agHelper.GetNAssertElementText(
        propPane._actionPopupTextLabel,
        "Query params",
        "have.text",
        0,
      );

      agHelper.GetNAssertElementText(
        propPane._sameWindowDropdownOption,
        "Same window",
        "have.text",
        0,
      );

      propPane.EnterJSContext(
        "onClick",
        "{{navigateTo('Page1', {a:1}, 'NEW_WINDOW')}}",
        true,
        true,
      );
      propPane.ToggleJSMode("onClick", false);

      agHelper.GetNAssertElementText(
        propPane._actionCard,
        "Navigate toPage1",
        "have.text",
        0,
      );
      agHelper.GetNClick(propPane._actionCard, 0);

      agHelper.AssertElementVisibility(propPane._navigateToType("Page name"));

      agHelper.GetNAssertElementText(
        propPane._actionOpenDropdownSelectPage,
        "Page1",
        "have.text",
        0,
      );

      agHelper.GetNAssertElementText(
        propPane._actionPopupTextLabel,
        "Query params",
        "have.text",
        0,
      );

      agHelper.GetNAssertElementText(
        propPane._sameWindowDropdownOption,
        "New window",
        "have.text",
        0,
      );

      propPane.EnterJSContext(
        "onClick",
        "{{navigateTo('google.com', {a:1}, 'SAME_WINDOW')}}",
        true,
        true,
      );
      propPane.ToggleJSMode("onClick", false);

      agHelper.GetNAssertElementText(
        propPane._actionCard,
        "Navigate togoogle.com",
        "have.text",
        0,
      );
      agHelper.GetNClick(propPane._actionCard, 0);

      agHelper.AssertElementVisibility(propPane._navigateToType("URL"));

      agHelper.GetNAssertElementText(
        propPane._actionPopupTextLabel,
        "Enter URL",
        "have.text",
        0,
      );

      agHelper.GetNAssertElementText(
        propPane._actionPopupTextLabel,
        "Query params",
        "have.text",
        1,
      );

      agHelper.GetNAssertElementText(
        propPane._sameWindowDropdownOption,
        "Same window",
        "have.text",
        0,
      );
    });

    it("2. shows fields for show alert from js to non-js mode", () => {
      EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);

      propPane.EnterJSContext("onClick", "{{showAlert()}}", true, false);
      propPane.ToggleJSMode("onClick", false);

      agHelper.GetNAssertElementText(
        propPane._actionCard,
        "Show alertAdd message",
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
        propPane._dropdownSelectType,
        "Select type",
        "have.text",
        0,
      );

      propPane.EnterJSContext(
        "onClick",
        "{{showAlert('hello', 'info')}}",
        true,
        false,
      );
      propPane.ToggleJSMode("onClick", false);

      agHelper.GetNAssertElementText(
        propPane._actionCard,
        "Show alerthello",
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
      agHelper.ValidateCodeEditorContent(propPane._textView, "hello");

      agHelper.GetNAssertElementText(
        propPane._dropdownSelectType,
        "Info",
        "have.text",
        0,
      );
    });

    it("3. shows fields for show modal from js to non-js mode", () => {
      EditorNavigation.SelectEntityByName("Page1", EntityType.Page);

      entityExplorer.DragDropWidgetNVerify("modalwidget", 300, 400);
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);

      propPane.EnterJSContext("onClick", "{{showModal()}}", true, false);
      propPane.ToggleJSMode("onClick", false);

      agHelper.GetNAssertElementText(
        propPane._actionCard,
        "Show modalnone",
        "have.text",
        0,
      );
      agHelper.GetNClick(propPane._actionCard, 0);

      agHelper.GetNAssertElementText(
        propPane._actionOpenDropdownSelectModal,
        "Select modal",
        "have.text",
        0,
      );

      propPane.EnterJSContext(
        "onClick",
        "{{showModal(Modal1.name)}}",
        true,
        false,
      );
      propPane.ToggleJSMode("onClick", false);

      agHelper.GetNAssertElementText(
        propPane._actionCard,
        "Show modalModal1",
        "have.text",
        0,
      );
      agHelper.GetNClick(propPane._actionCard, 0);

      agHelper.GetNAssertElementText(
        propPane._actionOpenDropdownSelectModal,
        "Modal1",
        "have.text",
        0,
      );
    });

    it("4. shows fields for remove modal from js to non-js mode", () => {
      EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);

      propPane.EnterJSContext("onClick", "{{closeModal()}}", true, false);
      propPane.ToggleJSMode("onClick", false);

      agHelper.GetNAssertElementText(
        propPane._actionCard,
        "Close modalnone",
        "have.text",
        0,
      );
      agHelper.GetNClick(propPane._actionCard, 0);

      agHelper.GetNAssertElementText(
        propPane._actionOpenDropdownSelectModal,
        "Select modal",
        "have.text",
        0,
      );

      propPane.EnterJSContext(
        "onClick",
        "{{closeModal(Modal1.name)}}",
        true,
        false,
      );
      propPane.ToggleJSMode("onClick", false);

      agHelper.GetNAssertElementText(
        propPane._actionCard,
        "Close modalModal1",
        "have.text",
        0,
      );
      agHelper.GetNClick(propPane._actionCard, 0);

      agHelper.GetNAssertElementText(
        propPane._actionOpenDropdownSelectModal,
        "Modal1",
        "have.text",
        0,
      );
    });

    it("5. should shows appropriate fields for store value", () => {
      EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);

      propPane.EnterJSContext("onClick", "{{storeValue()}}", true, false);
      propPane.ToggleJSMode("onClick", false);

      agHelper.GetNAssertElementText(
        propPane._actionCard,
        "Store valueAdd key",
        "have.text",
        0,
      );
      agHelper.GetNClick(propPane._actionCard, 0);

      agHelper.GetNAssertElementText(
        propPane._actionPopupTextLabel,
        "Key",
        "have.text",
        0,
      );
      agHelper.GetNAssertElementText(
        propPane._actionPopupTextLabel,
        "Value",
        "have.text",
        1,
      );

      propPane.EnterJSContext(
        "onClick",
        "{{storeValue('a', '')}}",
        true,
        false,
      );
      propPane.ToggleJSMode("onClick", false);

      agHelper.GetNAssertElementText(
        propPane._actionCard,
        "Store valuea",
        "have.text",
        0,
      );
      agHelper.GetNClick(propPane._actionCard, 0);

      propPane.EnterJSContext("onClick", "{{storeValue('a', 1)}}", true, false);
      propPane.ToggleJSMode("onClick", false);

      agHelper.GetNAssertElementText(
        propPane._actionCard,
        "Store valuea",
        "have.text",
        0,
      );
      agHelper.GetNClick(propPane._actionCard, 0);

      agHelper.ValidateCodeEditorContent(propPane._textView, "a{{1}}");

      propPane.EnterJSContext("onClick", "{{storeValue('', 1)}}", true, false);
      propPane.ToggleJSMode("onClick", false);

      agHelper.GetNAssertElementText(
        propPane._actionCard,
        "Store valueAdd key",
        "have.text",
        0,
      );
      agHelper.GetNClick(propPane._actionCard, 0);
    });

    it("6. shows fields for remove value appropriately", () => {
      EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);

      propPane.EnterJSContext("onClick", "{{removeValue()}}", true, false);
      propPane.ToggleJSMode("onClick", false);

      agHelper.GetNAssertElementText(
        propPane._actionCard,
        "Remove valueAdd key",
        "have.text",
        0,
      );
      agHelper.GetNClick(propPane._actionCard, 0);

      agHelper.GetNAssertElementText(
        propPane._actionPopupTextLabel,
        "Key",
        "have.text",
        0,
      );

      propPane.EnterJSContext("onClick", "{{removeValue('a')}}", true, false);
      propPane.ToggleJSMode("onClick", false);

      agHelper.GetNAssertElementText(
        propPane._actionCard,
        "Remove valuea",
        "have.text",
        0,
      );
      agHelper.GetNClick(propPane._actionCard, 0);

      agHelper.ValidateCodeEditorContent(propPane._textView, "a");
    });

    it("7. shows fields appropriately for the download function", () => {
      EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);

      propPane.EnterJSContext("onClick", "{{download()}}", true, false);
      propPane.ToggleJSMode("onClick", false);

      agHelper.GetNAssertElementText(
        propPane._actionCard,
        "DownloadAdd data to download",
        "have.text",
        0,
      );
      agHelper.GetNClick(propPane._actionCard, 0);

      agHelper.GetNAssertElementText(
        propPane._actionPopupTextLabel,
        "Data to download",
        "have.text",
        0,
      );
      agHelper.GetNAssertElementText(
        propPane._actionPopupTextLabel,
        "File name with extension",
        "have.text",
        1,
      );
      agHelper.GetNAssertElementText(
        propPane._selectorViewLabel,
        "Type",
        "have.text",
        0,
      );

      agHelper.GetNAssertElementText(
        propPane._selectorViewButton,
        "Select file type (optional)",
      );

      propPane.EnterJSContext(
        "onClick",
        "{{download('a', '', '')}}",
        true,
        false,
      );
      propPane.ToggleJSMode("onClick", false);

      agHelper.GetNAssertElementText(
        propPane._actionCard,
        "DownloadAdd data to download",
        "have.text",
        0,
      );

      propPane.EnterJSContext(
        "onClick",
        "{{download('a', 'b', '')}}",
        true,
        false,
      );
      propPane.ToggleJSMode("onClick", false);

      agHelper.GetNAssertElementText(
        propPane._actionCard,
        "Downloadb",
        "have.text",
        0,
      );

      propPane.EnterJSContext(
        "onClick",
        "{{download('a', 'b', 'image/png')}}",
        true,
        false,
      );
      propPane.ToggleJSMode("onClick", false);

      agHelper.GetNAssertElementText(
        propPane._actionCard,
        "Downloadb",
        "have.text",
        0,
      );
      agHelper.GetNClick(propPane._actionCard, 0);
      agHelper.ValidateCodeEditorContent(propPane._textView, "ab");

      agHelper.GetNAssertElementText(
        propPane._selectorViewButton,
        "PNG",
        "have.text",
        0,
      );
    });

    it("8. shows fields for copyToClipboard appropriately", () => {
      EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);

      propPane.EnterJSContext("onClick", "{{copyToClipboard()}}", true, false);
      propPane.ToggleJSMode("onClick", false);

      agHelper.GetNAssertElementText(
        propPane._actionCard,
        "Copy to clipboardAdd text",
        "have.text",
        0,
      );
      agHelper.GetNClick(propPane._actionCard, 0);

      agHelper.GetNAssertElementText(
        propPane._actionPopupTextLabel,
        "Text to be copied to clipboard",
        "have.text",
        0,
      );

      propPane.EnterJSContext(
        "onClick",
        "{{copyToClipboard('a')}}",
        true,
        false,
      );
      propPane.ToggleJSMode("onClick", false);

      agHelper.GetNAssertElementText(
        propPane._actionCard,
        "Copy to clipboarda",
        "have.text",
        0,
      );
      agHelper.GetNClick(propPane._actionCard, 0);

      agHelper.ValidateCodeEditorContent(propPane._textView, "a");
      agHelper.TypeText(
        propPane._actionSelectorFieldByLabel("Text to be copied to clipboard"),
        "line1{enter}line2{enter}line3",
        { parseSpecialCharSeq: true },
      );
      propPane.ToggleJSMode("onClick");
      propPane.ValidatePropertyFieldValue(
        "onClick",
        `{{copyToClipboard('aline1\\nline2\\nline3');}}`,
      );
    });

    it("9. shows fields for reset widget appropriately", () => {
      EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);

      propPane.EnterJSContext("onClick", "{{resetWidget()}}", true, false);
      propPane.ToggleJSMode("onClick", false);

      agHelper.GetNAssertElementText(
        propPane._actionCard,
        "Reset widgetSelect widget",
        "have.text",
        0,
      );
      agHelper.GetNClick(propPane._actionCard, 0);

      agHelper.GetNAssertElementText(
        propPane._selectorViewLabel,
        "Widget",
        "have.text",
        0,
      );

      agHelper.GetNAssertElementText(
        propPane._selectorViewLabel,
        "Reset Children",
        "have.text",
        1,
      );

      agHelper.GetNAssertElementText(
        propPane._selectorViewButton,
        "Select widget",
        "have.text",
        0,
      );

      agHelper.GetNAssertElementText(
        propPane._selectorViewButton,
        "true",
        "have.text",
        1,
      );

      propPane.EnterJSContext(
        "onClick",
        '{{resetWidget("Modal1", false)}}',
        true,
        false,
      );
      propPane.ToggleJSMode("onClick", false);

      agHelper.GetNAssertElementText(
        propPane._actionCard,
        "Reset widgetModal1",
        "have.text",
        0,
      );
      agHelper.GetNClick(propPane._actionCard, 0);

      agHelper.GetNAssertElementText(
        propPane._selectorViewButton,
        "Modal1",
        "have.text",
        0,
      );

      agHelper.GetNAssertElementText(
        propPane._selectorViewButton,
        "false",
        "have.text",
        1,
      );

      propPane.EnterJSContext(
        "onClick",
        '{{resetWidget("Modal1")}}',
        true,
        false,
      );
      propPane.ToggleJSMode("onClick", false);

      agHelper.GetNAssertElementText(
        propPane._actionCard,
        "Reset widgetModal1",
        "have.text",
        0,
      );
      agHelper.GetNClick(propPane._actionCard, 0);

      agHelper.GetNAssertElementText(
        propPane._selectorViewButton,
        "Modal1",
        "have.text",
        0,
      );

      agHelper.GetNAssertElementText(
        propPane._selectorViewButton,
        "true",
        "have.text",
        1,
      );

      propPane.EnterJSContext(
        "onClick",
        "{{resetWidget('', false)}}",
        true,
        false,
      );
      propPane.ToggleJSMode("onClick", false);

      agHelper.GetNAssertElementText(
        propPane._actionCard,
        "Reset widgetSelect widget",
        "have.text",
        0,
      );
      agHelper.GetNClick(propPane._actionCard, 0);

      agHelper.GetNAssertElementText(
        propPane._selectorViewButton,
        "Select widget",
        "have.text",
        0,
      );

      agHelper.GetNAssertElementText(
        propPane._selectorViewButton,
        "false",
        "have.text",
        1,
      );
    });
  },
);
