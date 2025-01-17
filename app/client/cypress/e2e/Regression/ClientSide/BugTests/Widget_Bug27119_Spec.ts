import {
  entityExplorer,
  propPane,
  draggableWidgets,
  agHelper,
  deployMode,
  locators,
  jsEditor,
} from "../../../../support/Objects/ObjectsCore";

describe("Reset widget action", { tags: ["@tag.All", "@tag.Binding"] }, () => {
  it("Reset widget to default after setValue has been applied", () => {
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.INPUT_V2);
    propPane.UpdatePropertyFieldValue("Default value", "John");

    entityExplorer.DragDropWidgetNVerify(draggableWidgets.BUTTON, 300, 300);
    propPane.EnterJSContext("onClick", `{{Input1.setValue('Hello!')}}`);
    propPane.UpdatePropertyFieldValue("Label", "Set value");

    entityExplorer.DragDropWidgetNVerify(draggableWidgets.BUTTON, 500, 100);
    propPane.EnterJSContext("onClick", `{{resetWidget("Input1")}}`);
    propPane.UpdatePropertyFieldValue("Label", "Reset value");

    deployMode.DeployApp();

    agHelper.ClickButton("Set value");
    agHelper.AssertText(
      locators._widgetInDeployed(draggableWidgets.INPUT_V2) + " input",
      "val",
      "Hello!",
    );

    agHelper.ClickButton("Reset value");
    agHelper.AssertText(
      locators._widgetInDeployed(draggableWidgets.INPUT_V2) + " input",
      "val",
      "John",
    );

    agHelper.ClearNType(
      locators._widgetInDeployed(draggableWidgets.INPUT_V2) + " input",
      "Testing",
    );
    agHelper.ClickButton("Reset value");
    agHelper.AssertText(
      locators._widgetInDeployed(draggableWidgets.INPUT_V2) + " input",
      "val",
      "John",
    );
  });
  it("Reset value is accessible after 'awaiting'", () => {
    deployMode.NavigateBacktoEditor();
    agHelper.ClearNType(locators._input, "Meta Text");

    const JS_OBJECT_BODY = `export default {
      async resetInputWithoutAwait () {
         resetWidget('Input1')
         showAlert(Input1.text)	
      },
      async resetInputWithAwait () {
      await resetWidget('Input1')
      showAlert(Input1.text)	
      }
    }`;

    // Create js object
    jsEditor.CreateJSObject(JS_OBJECT_BODY, {
      paste: true,
      completeReplace: true,
      toRun: false,
      prettify: false,
      shouldCreateNewJSObj: true,
    });
    agHelper.Sleep(4000);
    jsEditor.SelectFunctionDropdown("resetInputWithoutAwait");
    agHelper.ClickButton("Run");
    agHelper.AssertContains("Meta Text");

    jsEditor.SelectFunctionDropdown("resetInputWithAwait");
    agHelper.ClickButton("Run");
    agHelper.AssertContains("John");
  });
});
