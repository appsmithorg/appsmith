import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const ee = ObjectsRegistry.EntityExplorer,
  jsEditor = ObjectsRegistry.JSEditor;

describe("Validate basic operations on Entity explorer JSEditor structure", () => {
  const pageId = "Page1";

  it("1. Validate JSObject creation & Run", () => {
    jsEditor.CreateJSObject('return "Hello World";');
    ee.ExpandCollapseEntity("Queries/JS");
    ee.AssertEntityPresenceInExplorer("JSObject1");
    jsEditor.ValidateDefaultJSObjProperties("JSObject1");

    //Validate Rename JSObject from Form Header
    jsEditor.RenameJSObjFromPane("RenamedJSObject");
    ee.AssertEntityPresenceInExplorer("RenamedJSObject");
    jsEditor.ValidateDefaultJSObjProperties("RenamedJSObject");

    // Validate Copy JSObject
    ee.ActionContextMenuByEntityName("RenamedJSObject", "Copy to page", pageId);
    cy.wait("@createNewJSCollection").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      201,
    );
    ee.AssertEntityPresenceInExplorer("RenamedJSObjectCopy");
    jsEditor.ValidateDefaultJSObjProperties("RenamedJSObjectCopy");

    //Validate Rename JSObject from Entity Explorer
    jsEditor.RenameJSObjFromExplorer("RenamedJSObject", "ExplorerRenamed");
    ee.AssertEntityPresenceInExplorer("ExplorerRenamed");
    jsEditor.ValidateDefaultJSObjProperties("ExplorerRenamed");
  });

  it("2. Validate Move JSObject", function () {
    const newPageId = "Page2";
    ee.AddNewPage();
    ee.AssertEntityPresenceInExplorer(newPageId);
    ee.SelectEntityByName(pageId);
    ee.ActionContextMenuByEntityName(
      "RenamedJSObjectCopy",
      "Move to page",
      newPageId,
    );
    ee.SelectEntityByName(newPageId);
    ee.ExpandCollapseEntity("Queries/JS");
    ee.AssertEntityPresenceInExplorer("RenamedJSObjectCopy");
    jsEditor.ValidateDefaultJSObjProperties("RenamedJSObjectCopy");
  });

  it("3. Validate Deletion of JSObject", function () {
    ee.SelectEntityByName(pageId);
    ee.ActionContextMenuByEntityName(
      "ExplorerRenamed",
      "Delete",
      "Are you sure?",
      true,
    );
    ee.AssertEntityAbsenceInExplorer("ExplorerRenamed");
  });
});
