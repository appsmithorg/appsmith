import {
  agHelper,
  locators,
  propPane,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

describe("JS to non-JS mode in Action Selector", { tags: ["@tag.JS"] }, () => {
  before(() => {
    agHelper.AddDsl("promisesBtnDsl", locators._buttonByText("Submit"));
  });

  it("10. Bug 23167 - Message field in PostMessage should accept all type of values", () => {
    EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
    EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);

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
