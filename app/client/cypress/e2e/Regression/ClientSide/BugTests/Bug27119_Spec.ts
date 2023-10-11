import {
  entityExplorer,
  propPane,
  draggableWidgets,
  agHelper,
  deployMode,
  locators,
} from "../../../../support/Objects/ObjectsCore";

describe("Bug 25894 - Moustache brackets should be highlighted", () => {
  it("1. should show {{ }} in bold", () => {
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
});
