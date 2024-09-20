import * as _ from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

describe("Sanitise toast error messages", { tags: ["@tag.JS"] }, () => {
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
    EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
    _.entityExplorer.DragDropWidgetNVerify("buttonwidget", 100, 200);
  });

  it("1. Does not show reference error label when js obj does not exist", () => {
    EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
    _.propPane.EnterJSContext("onClick", "{{a.kjbfjdfbkds()}}");
    _.agHelper.ClickButton("Submit");
    _.debuggerHelper.AssertDebugError("'a' is not defined.", "", true, false);
  });

  it("2. Does not show type error label when js obj function does not exist", () => {
    EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
    _.propPane.EnterJSContext("onClick", "{{JSObject1.myFun1efef()}}");
    // Assert the lint error that shows up
    _.debuggerHelper.AssertDebugError(
      `"myFun1efef" doesn't exist in JSObject1`,
      "",
      false,
      false,
    );
    _.agHelper.ClickButton("Submit");
    // Assert the execution error that shows up
    _.agHelper.WaitUntilToastDisappear("Object1.myFun1efef is not a function");
  });

  it("3. Does not show any label when msg is not given for post message", () => {
    EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
    _.propPane.EnterJSContext(
      "onClick",
      "{{postWindowMessage('', 'window', '');}}",
    );
    _.agHelper.ClickButton("Submit");
    _.agHelper.WaitUntilToastDisappear("Please enter a target origin URL.");
  });

  it("4. Does not show any label for clear watch when no location is active", () => {
    EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
    _.propPane.EnterJSContext(
      "onClick",
      "{{appsmith.geolocation.clearWatch();}}",
    );
    _.agHelper.ClickButton("Submit");
    _.agHelper.WaitUntilToastDisappear("No location watch active");
  });

  it("5. Does not show type error label when js obj function cant read properties of :", () => {
    EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
    _.propPane.EnterJSContext("onClick", "{{JSObject1.myFun1()}}");
    _.agHelper.ClickButton("Submit");
    _.agHelper.WaitUntilToastDisappear(
      "Cannot read properties of null (reading ':')",
    );
  });

  it("6. Does not show UncaughtPromiseRejection label when valid page url is not given", () => {
    EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
    _.propPane.ToggleJSMode("onClick", false);
    _.agHelper.GetNClick(
      _.propPane._actionCardByTitle("Execute a JS function"),
    );
    _.agHelper.GetNClick(_.propPane._actionSelectorDelete);
    _.propPane.SelectPlatformFunction("onClick", "Navigate to");
    _.agHelper.ClickButton("Submit");
    _.agHelper.WaitUntilToastDisappear("Enter a valid URL or page name");
  });
});
