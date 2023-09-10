import {
  agHelper,
  entityExplorer,
  locators,
  propPane,
} from "../../../../support/Objects/ObjectsCore";

describe("JS to non-JS mode in Action Selector", () => {
  before(() => {
    agHelper.AddDsl("promisesBtnDsl", locators._buttonByText("Submit"));
  });

  it("10. Bug 23167 - Message field in PostMessage should accept all type of values", () => {
    entityExplorer.SelectEntityByName("Page1", "Pages");
    entityExplorer.SelectEntityByName("Button1", "Widgets");

    propPane.EnterJSContext(
      "onClick",
      "{{postWindowMessage(Input1.text, 'window', '*')}}",
      true,
      false,
    );
    propPane.ToggleJSMode("onClick", false);

    agHelper.GetNAssertElementText(
      propPane._actionCard,
      "Post message{{Input1.text}}",
      "have.text",
      0,
    );
    agHelper.GetNClick(propPane._actionCard, 0);

    agHelper.ValidateCodeEditorContent(
      propPane._textView,
      "{{Input1.text}}window*",
    );

    propPane.EnterJSContext(
      "onClick",
      "{{postWindowMessage({ x: Input1.text }, 'window', '*')}}",
      true,
      false,
    );
    propPane.ToggleJSMode("onClick", false);
    agHelper.GetNClick(propPane._actionCard, 0);
    agHelper.ValidateCodeEditorContent(
      propPane._textView,
      "{{{\n x: Input1.text \n}}}window*",
    );
  });
});
