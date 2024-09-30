import {
  agHelper,
  entityExplorer,
  jsEditor,
  propPane,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

describe("Tests fetch calls", { tags: ["@tag.JS"] }, () => {
  it("1. Ensures that cookies are not passed with fetch calls", function () {
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
  it("2. Tests if fetch works with setTimeout", function () {
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

  it("3. Tests if fetch works with store value", function () {
    entityExplorer.DragDropWidgetNVerify("buttonwidget", 500, 200);
    EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
    propPane.TypeTextIntoField("Label", "getUserID");
    propPane.EnterJSContext(
      "onClick",
      `{{fetch('http://host.docker.internal:5001/v1/mock-api?records=1')
        .then(res => res.json())
        .then(json => {
          const user = json[0]; // Get the first record
          storeValue('userId', user.id);
          showAlert("UserId: " + appsmith.store.userId);
        })}}`,
    );

    agHelper.Sleep(2000);
    agHelper.ClickButton("getUserID");
    agHelper.AssertContains("UserId: 1", "exist");
  });
});
