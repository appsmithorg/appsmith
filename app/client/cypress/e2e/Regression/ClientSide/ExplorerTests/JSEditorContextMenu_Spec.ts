import {
  entityExplorer,
  jsEditor,
  entityItems,
} from "../../../../support/Objects/ObjectsCore";

describe("Validate basic operations on Entity explorer JSEditor structure", () => {
  const pageId = "Page1";

  it("1. Validate JSObject creation & Run", () => {
    jsEditor.CreateJSObject('return "Hello World";');
    entityExplorer.ExpandCollapseEntity("Queries/JS");
    entityExplorer.AssertEntityPresenceInExplorer("JSObject1");
    jsEditor.ValidateDefaultJSObjProperties("JSObject1");

    //Validate Rename JSObject from Form Header
    jsEditor.RenameJSObjFromPane("RenamedJSObject");
    entityExplorer.AssertEntityPresenceInExplorer("RenamedJSObject");
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
    entityExplorer.AssertEntityPresenceInExplorer("RenamedJSObjectCopy");
    jsEditor.ValidateDefaultJSObjProperties("RenamedJSObjectCopy");

    //Validate Rename JSObject from Entity Explorer
    jsEditor.RenameJSObjFromExplorer("RenamedJSObject", "ExplorerRenamed");
    entityExplorer.AssertEntityPresenceInExplorer("ExplorerRenamed");
    jsEditor.ValidateDefaultJSObjProperties("ExplorerRenamed");
  });

  it("2. Validate Move JSObject", function () {
    const newPageId = "Page2";
    entityExplorer.AddNewPage();
    entityExplorer.AssertEntityPresenceInExplorer(newPageId);
    entityExplorer.SelectEntityByName(pageId);
    entityExplorer.ActionContextMenuByEntityName({
      entityNameinLeftSidebar: "RenamedJSObjectCopy",
      action: "Move to page",
      subAction: newPageId,
      toastToValidate: "moved to page",
    });
    entityExplorer.SelectEntityByName(newPageId);
    entityExplorer.ExpandCollapseEntity("Queries/JS");
    entityExplorer.AssertEntityPresenceInExplorer("RenamedJSObjectCopy");
    jsEditor.ValidateDefaultJSObjProperties("RenamedJSObjectCopy");
  });

  it("3. Validate Deletion of JSObject", function () {
    entityExplorer.SelectEntityByName(pageId);
    entityExplorer.ActionContextMenuByEntityName({
      entityNameinLeftSidebar: "ExplorerRenamed",
      action: "Delete",
      entityType: entityItems.JSObject,
    });
    entityExplorer.AssertEntityAbsenceInExplorer("ExplorerRenamed");
  });
});
