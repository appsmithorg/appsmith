import { ObjectsRegistry } from "../../../../support/Objects/Registry";
const jsEditor = ObjectsRegistry.JSEditor;
const agHelper = ObjectsRegistry.AggregateHelper;
const explorerHelper = ObjectsRegistry.EntityExplorer;
const propertyPaneHelper = ObjectsRegistry.PropertyPane;
const aggregateHelper = ObjectsRegistry.AggregateHelper;

describe("Tests fetch calls", () => {
  it("1. Ensures that cookies are not passed with fetch calls", function() {
    jsEditor.CreateJSObject(
      `export default {
        myVar1: [],
        myVar2: {},
        myFun1: async (x = "default") => {
          return fetch("/api/v1/users/me", { credentials: 'include' }).then(res => res.json()).then(function(res) {
            showAlert(res.data.username);
          })
        },
        myFun2: async function() {
          const req = new Request("/api/v1/users/me", { credentials: 'include' });
          const res = await fetch(req);
          const jsonRes = await res.json();
          showAlert(jsonRes.data.username);
        }
      }`,
      {
        paste: true,
        completeReplace: true,
        toRun: false,
        shouldCreateNewJSObj: true,
        prettify: true,
      },
    );
    agHelper.Sleep(2000);
    jsEditor.RunJSObj();
    agHelper.AssertContains("anonymousUser", "exist");

    jsEditor.SelectFunctionDropdown("myFun2");
    jsEditor.RunJSObj();
    agHelper.AssertContains("anonymousUser", "exist");
  });
  it("2. Tests if fetch works with setTimeout", function() {
    jsEditor.CreateJSObject(
      `export default {
              myVar1: [],
              myVar2: {},
              delay: (fn, x = 1000) => {
                  setTimeout(fn, x);
              },
              api: async function() {
                const req = new Request("/api/v1/users/me", { credentials: 'include' });
                const res = await fetch(req);
                const jsonRes = await res.json();
                showAlert(jsonRes.data.username);
              },
              invoker() {
                this.delay(this.api, 3000);
              }
          }`,
      {
        paste: true,
        completeReplace: true,
        toRun: false,
        shouldCreateNewJSObj: true,
        prettify: true,
      },
    );
    agHelper.Sleep(2000);
    jsEditor.SelectFunctionDropdown("invoker");
    jsEditor.RunJSObj();
    agHelper.Sleep(3000);
    agHelper.AssertContains("anonymousUser", "exist");
  });

  it("3. Tests if fetch works with store value", function() {
    explorerHelper.NavigateToSwitcher("widgets");
    explorerHelper.DragDropWidgetNVerify("buttonwidget", 500, 200);
    explorerHelper.SelectEntityByName("Button1");
    propertyPaneHelper.TypeTextIntoField("Label", "getUserID");
    propertyPaneHelper.EnterJSContext(
      "onClick",
      `{{fetch('https://jsonplaceholder.typicode.com/todos/1')
    .then(res => res.json())
    .then(json => storeValue('userId', json.userId))
    .then(() => showAlert("UserId: " + appsmith.store.userId))}}`,
    );
    aggregateHelper.Sleep(2000);
    aggregateHelper.ClickButton("getUserID");
    agHelper.AssertContains("UserId: 1", "exist");
  });
});
