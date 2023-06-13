import {
  agHelper,
  jsEditor,
  apiPage,
  entityExplorer,
} from "../../../../support/Objects/ObjectsCore";

describe("Bug #15372 Catch block was not triggering in Safari/firefox", () => {
  it("1. Triggers the catch block when the API hits a 404", () => {
    apiPage.CreateAndFillApi("https://swapi.dev/api/people/18261826");
    jsEditor.CreateJSObject(
      `export default {
      fun: async () => {
        return await Api1.run().catch((e) => showAlert("404 hit : " + e.message));
      }
    }`,
      {
        paste: true,
        completeReplace: true,
        toRun: true,
        shouldCreateNewJSObj: true,
      },
    );
    agHelper.AssertContains("404 hit : Api1 failed to execute");
    agHelper.ActionContextMenuWithInPane({
      action: "Delete",
      subAction: "Are you sure?",
    });
    entityExplorer.SelectEntityByName("Api1", "Queries/JS");
    entityExplorer.ActionContextMenuByEntityName({
      entityNameinLeftSidebar: "Api1",
      action: "Delete",
    });
  });
});
