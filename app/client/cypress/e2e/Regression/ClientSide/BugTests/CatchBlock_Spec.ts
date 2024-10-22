import {
  agHelper,
  jsEditor,
  apiPage,
  entityExplorer,
  entityItems,
  dataManager,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

describe(
  "Bug #15372 Catch block was not triggering in Safari/firefox",
  { tags: ["@tag.Datasource", "@tag.Git", "@tag.AccessControl"] },
  () => {
    it("1. Triggers the catch block when the API hits a 404", () => {
      apiPage.CreateAndFillApi(
        dataManager.dsValues[dataManager.defaultEnviorment].mockHttpCodeUrl +
          "404",
      );
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
        entityType: entityItems.JSObject,
      });
      EditorNavigation.SelectEntityByName("Api1", EntityType.Api);
      entityExplorer.ActionContextMenuByEntityName({
        entityNameinLeftSidebar: "Api1",
        action: "Delete",
        entityType: entityItems.Api,
      });
    });
  },
);
