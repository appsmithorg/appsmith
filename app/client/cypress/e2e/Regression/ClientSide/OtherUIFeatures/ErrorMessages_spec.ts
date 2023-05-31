import * as _ from "../../../../support/Objects/ObjectsCore";

describe("Sanitise toast error messages", () => {
  before(() => {
    _.jsEditor.CreateJSObject(
      `export default {
  myVar1: null,
  myVar2: {},
  myFun1() {
    return this.myVar1[':'];
  },
  myFun2() {
    a.kjbfjdfbkds();
  }
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
    _.entityExplorer.SelectEntityByName("Page1", "Pages");
    _.entityExplorer.DragDropWidgetNVerify("buttonwidget", 100, 200);
  });

  it("Does not show reference error label when js obj does not exist", () => {
    _.entityExplorer.SelectEntityByName("Button1", "Widgets");
    _.propPane.EnterJSContext("onClick", "{{a.kjbfjdfbkds()}}");
    _.agHelper.ClickButton("Submit");
    _.agHelper.ValidateToastMessage("a is not defined");
  });

  it("Does not show type error label when js obj function does not exist", () => {
    _.entityExplorer.SelectEntityByName("Button1", "Widgets");
    _.propPane.EnterJSContext("onClick", "{{JSObject1.myFun1efef()}}");
    _.agHelper.ClickButton("Submit");
    _.agHelper.ValidateToastMessage("Object1.myFun1efef is not a function");
  });

  it("Does not show any label when msg is not given for post message", () => {
    _.entityExplorer.SelectEntityByName("Button1", "Widgets");
    _.propPane.EnterJSContext(
      "onClick",
      "{{postWindowMessage('', 'window', '');}}",
    );
    _.agHelper.ClickButton("Submit");
    _.agHelper.ValidateToastMessage("Please enter a target origin URL.");
  });

  it("Does not show any label for clear watch when no location is active", () => {
    _.entityExplorer.SelectEntityByName("Button1", "Widgets");
    _.propPane.EnterJSContext(
      "onClick",
      "{{appsmith.geolocation.clearWatch();}}",
    );
    _.agHelper.ClickButton("Submit");
    _.agHelper.ValidateToastMessage("No location watch active");
  });

  it("Does not show type error label when js obj function cant read properties of :", () => {
    _.entityExplorer.SelectEntityByName("Button1", "Widgets");
    _.propPane.EnterJSContext("onClick", "{{JSObject1.myFun1()}}");
    _.agHelper.ClickButton("Submit");
    _.agHelper.ValidateToastMessage(
      "Cannot read properties of null (reading ':')",
    );
  });

  it("Does not show UncaughtPromiseRejection label when valid page url is not given", () => {
    _.entityExplorer.SelectEntityByName("Button1", "Widgets");
    _.jsEditor.DisableJSContext("onClick");
    _.agHelper.GetNClick(
      _.propPane._actionCardByTitle("Execute a JS function"),
    );
    _.agHelper.GetNClick(_.propPane._actionSelectorDelete);
    _.propPane.SelectPlatformFunction("onClick", "Navigate to");
    _.agHelper.ClickButton("Submit");
    _.agHelper.ValidateToastMessage("Enter a valid URL or page name");
  });
});
