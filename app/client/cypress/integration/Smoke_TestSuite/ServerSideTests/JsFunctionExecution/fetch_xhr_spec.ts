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
                  fetch("/api/v1/users/me", { credentials: 'include' }).then(res => res.json()).then(function(data) {
                    showAlert(data.username);
                  })
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
  });
});
