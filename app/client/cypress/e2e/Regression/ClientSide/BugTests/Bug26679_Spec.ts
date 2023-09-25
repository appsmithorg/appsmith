import * as _ from "../../../../support/Objects/ObjectsCore";

describe("Bug 26679 - JS variable mutation bug", () => {
  it("Bug 26679 - Assignment to a js variable is not triggering reactivity", () => {
    _.jsEditor.CreateJSObject(
      `export default {
        myVar1: [0, 1, 2],
        myFun1 () {
          this.myVar1 = [1,2,3];

          this.myVar1[0] = 10;
        },
      }`,
      {
        paste: true,
        completeReplace: true,
        toRun: false,
        shouldCreateNewJSObj: true,
        lineNumber: 4,
        prettify: true,
      },
    );

    _.entityExplorer.DragDropWidgetNVerify(
      _.draggableWidgets.INPUT_V2,
      100,
      100,
    );
    _.propPane.UpdatePropertyFieldValue(
      "Default value",
      "{{JSObject1.myVar1[0]}}",
    );

    _.entityExplorer.DragDropWidgetNVerify(_.draggableWidgets.BUTTON, 200, 200);
    _.entityExplorer.SelectEntityByName("Button1", "Widgets");
    _.propPane.EnterJSContext("onClick", "{{JSObject1.myFun1()}}", true, false);

    _.deployMode.DeployApp();

    _.agHelper.AssertText(
      _.locators._widgetInDeployed(_.draggableWidgets.INPUT_V2) + " input",
      "val",
      "0",
    );

    _.agHelper.ClearNType(
      _.locators._widgetInDeployed(_.draggableWidgets.INPUT_V2) + " input",
      "Testing",
    );

    _.agHelper
      .GetElement(_.locators._widgetInDeployed(_.draggableWidgets.BUTTON))
      .click();

    _.agHelper.AssertText(
      _.locators._widgetInDeployed(_.draggableWidgets.INPUT_V2) + " input",
      "val",
      "10",
    );
  });
});
