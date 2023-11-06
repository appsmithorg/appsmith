import {
  entityExplorer,
  jsEditor,
  agHelper,
  locators,
  propPane,
  draggableWidgets,
  deployMode,
  debuggerHelper,
} from "../../../../support/Objects/ObjectsCore";

describe("Widget Property Setters - Part III - Tc #2409 - Validates SetOptions", () => {
  before(() => {
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.INPUT_V2, 300, 200);
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.SELECT, 300, 400);
    entityExplorer.SelectEntityByName("Input1");
    propPane.UpdatePropertyFieldValue("Default value", "{{Select1.options}}");
  });

  it("1. Set Widget property to unaccepted values & verify debug error", () => {
    //SetOptions to not acceptable value - Boolean
    jsEditor.CreateJSObject(
      `export default {
        myFun1 () {
          Select1.setOptions(false);
        }
      }`,
      {
        completeReplace: true,
      },
    );
    jsEditor.RunJSObj();
    entityExplorer.SelectEntityByName("Page1");
    agHelper
      .GetText(
        locators._widgetInDeployed(draggableWidgets.INPUT_V2) +
          " " +
          locators._input,
        "val",
      )
      .then((val) => {
        expect(val).to.eq("false");
      });
    debuggerHelper.AssertDebugError(
      "Default value is missing in options. Please update the value.",
      "",
      true,
      false,
    );

    //SetOptions to not acceptable value - Numeric
    entityExplorer.SelectEntityByName("JSObject1");
    jsEditor.EditJSObj(
      `export default {
        myFun1 () {
          Select1.setOptions(1234);
        }
      }`,
      false,
    );
    jsEditor.RunJSObj();
    entityExplorer.SelectEntityByName("Page1");
    agHelper
      .GetText(
        locators._widgetInDeployed(draggableWidgets.INPUT_V2) +
          " " +
          locators._input,
        "val",
      )
      .then((val) => {
        expect(val).to.eq("1234");
      });
    debuggerHelper.AssertDebugError(
      "Default value is missing in options. Please update the value.",
      "",
      false,
      false,
    );

    //SetOptions to not acceptable value - String
    entityExplorer.SelectEntityByName("JSObject1");
    jsEditor.EditJSObj(
      `export default {
        myFun1 () {
          Select1.setOptions('fdfjhgf7');
        }
      }`,
      false,
    );
    jsEditor.RunJSObj();
    entityExplorer.SelectEntityByName("Page1");
    agHelper
      .GetText(
        locators._widgetInDeployed(draggableWidgets.INPUT_V2) +
          " " +
          locators._input,
        "val",
      )
      .then((val) => {
        expect(val).to.eq("fdfjhgf7");
      });
    debuggerHelper.AssertDebugError(
      "Default value is missing in options. Please update the value.",
      "",
      false,
      false,
    );

    //SetOptions to not acceptable value - undefined
    entityExplorer.SelectEntityByName("JSObject1");
    jsEditor.EditJSObj(
      `export default {
        myFun1 () {
          Select1.setOptions(undefined);
        }
      }`,
      false,
    );
    jsEditor.RunJSObj();
    entityExplorer.SelectEntityByName("Page1");
    agHelper
      .GetText(
        locators._widgetInDeployed(draggableWidgets.INPUT_V2) +
          " " +
          locators._input,
        "val",
      )
      .then((val) => {
        expect(val).to.eq("fdfjhgf7");
      });
    debuggerHelper.AssertDebugError(
      "Default value is missing in options. Please update the value.",
      "",
      false,
      false,
    );

    //SetOptions to not acceptable value - null
    entityExplorer.SelectEntityByName("JSObject1");
    jsEditor.EditJSObj(
      `export default {
        myFun1 () {
          Select1.setOptions(null);
        }
      }`,
      false,
    );
    jsEditor.RunJSObj();
    entityExplorer.SelectEntityByName("Page1");
    agHelper
      .GetText(
        locators._widgetInDeployed(draggableWidgets.INPUT_V2) +
          " " +
          locators._input,
        "val",
      )
      .then((val) => {
        expect(val).to.be.empty;
      });
    debuggerHelper.AssertDebugError(
      "Default value is missing in options. Please update the value.",
      "",
      false,
      false,
    );

    //unabel to set +ve value to setOptions:
    // {{JSObject1.myFun1.data.map((item)=>{return{
    //   label: item.name,
    //     value: item.email									}	})}}
    // deployMode.DeployApp();
  });

  // afterEach(() => {
  //   deployMode.NavigateBacktoEditor();
  // });
});
