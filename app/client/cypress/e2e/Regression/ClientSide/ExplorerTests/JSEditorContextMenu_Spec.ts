import {
  entityExplorer,
  entityItems,
  jsEditor,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
  PageLeftPane,
} from "../../../../support/Pages/EditorNavigation";
import PageList from "../../../../support/Pages/PageList";

describe("Validate basic operations on Entity explorer JSEditor structure", () => {
  const pageId = "Page1";

  it("1. Validate JSObject creation & Run", () => {
    jsEditor.CreateJSObject('return "Hello World";');
    PageLeftPane.expandCollapseItem("Queries/JS");
    PageLeftPane.assertPresence("JSObject1");
    jsEditor.ValidateDefaultJSObjProperties("JSObject1");

    //Validate Rename JSObject from Form Header
    jsEditor.RenameJSObjFromPane("RenamedJSObject");
    PageLeftPane.assertPresence("RenamedJSObject");
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
    PageLeftPane.assertPresence(newPageId);
    EditorNavigation.SelectEntityByName(pageId, EntityType.Page);
    entityExplorer.ActionContextMenuByEntityName({
      entityNameinLeftSidebar: "RenamedJSObjectCopy",
      action: "Move to page",
      subAction: newPageId,
      toastToValidate: "moved to page",
    });
    EditorNavigation.SelectEntityByName(newPageId, EntityType.Page);
    PageLeftPane.expandCollapseItem("Queries/JS");
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
});
