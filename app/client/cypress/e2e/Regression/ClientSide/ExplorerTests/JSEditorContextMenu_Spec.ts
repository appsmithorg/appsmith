import {
  entityExplorer,
  entityItems,
  jsEditor,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
  PageLeftPane,
  PagePaneSegment,
} from "../../../../support/Pages/EditorNavigation";
import PageList from "../../../../support/Pages/PageList";
import { EntityItems } from "../../../../support/Pages/AssertHelper";

describe(
  "Validate basic operations on Entity explorer JSEditor structure",
  { tags: ["@tag.IDE", "@tag.PropertyPane"] },
  () => {
    const pageId = "Page1";

    it("1. Validate JSObject creation & Run", () => {
      jsEditor.CreateJSObject('return "Hello World";');
      PageLeftPane.assertPresence("JSObject1");
      jsEditor.ValidateDefaultJSObjProperties("JSObject1");

      //Validate Rename JSObject from Form Header
      jsEditor.RenameJSObjFromPane("RenamedJSObject");
      jsEditor.ValidateDefaultJSObjProperties("RenamedJSObject");

      // Validate Copy JSObject
      entityExplorer.ActionContextMenuByEntityName({
        entityNameinLeftSidebar: "RenamedJSObject",
        action: "Copy to page",
        subAction: pageId,
        toastToValidate: "copied to page",
      });
      cy.wait("@createNewJSCollection").should(
        "have.nested.property",
        "response.body.responseMeta.status",
        201,
      );
      PageLeftPane.assertPresence("RenamedJSObjectCopy");
      jsEditor.ValidateDefaultJSObjProperties("RenamedJSObjectCopy");

      //Validate Rename JSObject from Entity Explorer
      jsEditor.RenameJSObjFromExplorer("RenamedJSObject", "ExplorerRenamed");
      PageLeftPane.assertPresence("ExplorerRenamed");
      jsEditor.ValidateDefaultJSObjProperties("ExplorerRenamed");
    });

    it("2. Validate Move JSObject", function () {
      const newPageId = "Page2";
      PageList.AddNewPage();
      PageList.assertPresence(newPageId);
      EditorNavigation.SelectEntityByName(pageId, EntityType.Page);
      entityExplorer.ActionContextMenuByEntityName({
        entityNameinLeftSidebar: "RenamedJSObjectCopy",
        action: "Move to page",
        subAction: newPageId,
        toastToValidate: "moved to page",
        entityType: EntityItems.Page,
      });
      EditorNavigation.SelectEntityByName(newPageId, EntityType.Page);
      PageLeftPane.switchSegment(PagePaneSegment.JS);
      PageLeftPane.assertPresence("RenamedJSObjectCopy");
      jsEditor.ValidateDefaultJSObjProperties("RenamedJSObjectCopy");
    });

    it("3. Validate Deletion of JSObject", function () {
      EditorNavigation.SelectEntityByName(pageId, EntityType.Page);
      entityExplorer.ActionContextMenuByEntityName({
        entityNameinLeftSidebar: "ExplorerRenamed",
        action: "Delete",
        entityType: entityItems.JSObject,
      });
      PageLeftPane.assertAbsence("ExplorerRenamed");
    });
  },
);
