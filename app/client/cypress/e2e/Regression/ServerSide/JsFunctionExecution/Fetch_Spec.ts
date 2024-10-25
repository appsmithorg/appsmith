import {
  agHelper,
  apiPage,
  dataManager,
  entityExplorer,
  jsEditor,
  propPane,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

describe("Tests fetch calls", { tags: ["@tag.JS", "@tag.Binding"] }, () => {
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
    apiPage.CreateAndFillApi(
      dataManager.dsValues[dataManager.defaultEnviorment].mockGenderAge +
        `{{this.params.person}}`,
      "Gender_Age",
    );
    apiPage.RunAPI();
    entityExplorer.DragDropWidgetNVerify("buttonwidget", 500, 200);
    EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
    propPane.TypeTextIntoField("Label", "getUserName");
    propPane.EnterJSContext(
      "onClick",
      `{{(async function(){
          const gender = await Gender_Age.run({ person: "sagar" });
          storeValue("Gender", gender);
          showAlert("Your name is " + appsmith.store.Gender.name);
        })()}}`,
    );

    agHelper.ClickButton("getUserName");
    agHelper.AssertContains("Your name is sagar", "exist");
  });
});
