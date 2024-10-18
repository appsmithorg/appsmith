import { ObjectsRegistry } from "../../../../support/Objects/Registry";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

const {
  AggregateHelper: agHelper,
  DebuggerHelper: debuggerHelper,
  EntityExplorer: ee,
  JSEditor: jsEditor,
  PropertyPane: propPane,
} = ObjectsRegistry;

let logString;

const generateTestLogString = () => {
  const randString = Cypress._.random(0, 1e4);
  const logString = `Test ${randString}`;
  return logString;
};

describe("Debugger logs", { tags: ["@tag.Widget", "@tag.IDE", "@tag.PropertyPane", "@tag.Binding"] }, function () {
  this.beforeEach(() => {
    logString = generateTestLogString();
  });

  it("1. Console log on button click with normal moustache binding", function () {
    ee.DragDropWidgetNVerify("buttonwidget", 200, 200);
    // Testing with normal log in moustache binding
    propPane.EnterJSContext("onClick", `{{console.log("${logString}")}}`);
    agHelper.Sleep(2000);
    agHelper.ClickButton("Submit");
    debuggerHelper.OpenDebugger();
    agHelper.GetNClick(jsEditor._logsTab);
    debuggerHelper.DoesConsoleLogExist(logString);
  });

  it("2. Console log on button click with arrow function IIFE", function () {
    debuggerHelper.ClearLogs();
    EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
    // Testing with normal log in iifee
    propPane.EnterJSContext(
      "onClick",
      `{{(() => {
          console.log('${logString}');
        }) () }}`,
    );
    agHelper.ClickButton("Submit");
    debuggerHelper.DoesConsoleLogExist(logString);
  });

  it("3. Console log on button click with function keyword IIFE", function () {
    debuggerHelper.ClearLogs();
    EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
    // Testing with normal log in iifee
    propPane.EnterJSContext(
      "onClick",
      `{{ function () {
          console.log('${logString}');
        } () }}`,
    );
    agHelper.ClickButton("Submit");
    debuggerHelper.DoesConsoleLogExist(logString);
  });

  it("4. Console log on button click with async function IIFE", function () {
    debuggerHelper.ClearLogs();
    // Testing with normal log in iifee
    EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
    propPane.EnterJSContext(
      "onClick",
      `{{(async() => {
          console.log('${logString}');
        }) () }}`,
    );
    agHelper.ClickButton("Submit");
    debuggerHelper.DoesConsoleLogExist(logString);
  });

  it("5. Console log on button click with mixed function IIFE", function () {
    debuggerHelper.ClearLogs();
    // Testing with normal log in iifee
    EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
    const logStringChild = generateTestLogString();
    propPane.EnterJSContext(
      "onClick",
      `{{ function () {
          console.log('${logString}');
          (async () => {console.log('${logStringChild}')})();
        } () }}`,
    );
    agHelper.ClickButton("Submit");
    debuggerHelper.DoesConsoleLogExist(logString);
    debuggerHelper.DoesConsoleLogExist(logStringChild);
  });

  it("6. Console log grouping on button click", function () {
    debuggerHelper.ClearLogs();
    // Testing with normal log in iifee
    EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
    propPane.EnterJSContext(
      "onClick",
      `{{ function () {
          console.log('${logString}');
          console.log('${logString}');
          console.log('${logString}');
          console.log('${logString}');
          console.log('${logString}');
        } () }}`,
    );
    agHelper.Sleep(); //Wait for CI flakyness
    agHelper.ClickButton("Submit");
    debuggerHelper.DoesConsoleLogExist(logString);
    debuggerHelper.AssertConsecutiveConsoleLogCount(5);
  });

  it("7. Console log grouping on button click with different log in between", function () {
    debuggerHelper.ClearLogs();
    // Testing with normal log in iifee
    EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
    propPane.EnterJSContext(
      "onClick",
      `{{ function () {
          console.log('${logString}');
          console.log('${logString}');
          console.log('Different ${logString}');
          console.log('${logString}');
        } () }}`,
    );
    agHelper.ClickButton("Submit");
    debuggerHelper.DoesConsoleLogExist(logString);
    debuggerHelper.DoesConsoleLogExist(`Different ${logString}`);
    debuggerHelper.AssertConsecutiveConsoleLogCount(2);
  });

  it("8. Console log grouping on button click from different source", function () {
    debuggerHelper.ClearLogs();
    // Testing with normal log in iifee
    EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
    propPane.EnterJSContext("onClick", `{{console.log("${logString}")}}`);
    // Add another button
    ee.DragDropWidgetNVerify("buttonwidget", 400, 400);
    propPane.UpdatePropertyFieldValue("Label", "Submit2");
    propPane.EnterJSContext("onClick", `{{console.log("${logString}")}}`);
    agHelper.Sleep(2000);
    agHelper.ClickButton("Submit");
    agHelper.ClickButton("Submit2");
    debuggerHelper.DoesConsoleLogExist(logString);
    debuggerHelper.AssertConsecutiveConsoleLogCount(0);
    propPane.DeleteWidgetFromPropertyPane("Button1");
    propPane.DeleteWidgetFromPropertyPane("Button2");
  });
});
