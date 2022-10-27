import { ObjectsRegistry } from "../../../../support/Objects/Registry";
const jsEditor = ObjectsRegistry.JSEditor;
const agHelper = ObjectsRegistry.AggregateHelper;

describe("Tests fetch and xhr calls", () => {
  it("Ensures that cookies are not passed with fetch calls", function() {
    jsEditor.CreateJSObject(
      `export default {
              myVar1: [],
              myVar2: {},
              myFun1: async (x = "default") => {
                  fetch("/api/v1/users/me", { credentials: 'include' }).then(res => res.json()).then(function(res) {
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
});
