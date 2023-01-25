import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const {
  AggregateHelper: agHelper,
  ApiPage: apiPage,
  JSEditor: jsEditor,
  EntityExplorer : ee
} = ObjectsRegistry;

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
    agHelper.ActionContextMenuWithInPane("Delete", "Are you sure?", true);
    ee.SelectEntityByName("Api1", "Queries/JS");
    ee.ActionContextMenuByEntityName("Api1", "Delete");
  });
});
