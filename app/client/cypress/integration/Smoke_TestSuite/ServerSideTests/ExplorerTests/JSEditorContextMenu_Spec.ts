import { ObjectsRegistry } from "../../../../support/Objects/Registry"

let agHelper = ObjectsRegistry.AggregateHelper,
    ee = ObjectsRegistry.EntityExplorer,
    jsEditor = ObjectsRegistry.JSEditor;

describe("Validate basic operations on Entity explorer JSEditor structure", () => {
  const pageId = "Page1";

  it("1. Validate JSObject creation & Run", () => {
    jsEditor.CreateJSObject('return "Hello World";');
    ee.expandCollapseEntity("QUERIES/JS");
    ee.AssertEntityPresenceInExplorer("JSObject1");
    jsEditor.validateDefaultJSObjProperties("JSObject1");
  });

  it("2. Validate Rename JSObject from Form Header", function() {
    jsEditor.RenameJSObjFromForm("RenamedJSObject");
    ee.AssertEntityPresenceInExplorer("RenamedJSObject");
    jsEditor.validateDefaultJSObjProperties("RenamedJSObject");
  });

  it("3. Validate Copy JSObject", function() {
    ee.ActionContextMenuByEntityName(
      "RenamedJSObject",
      "Copy to page",
      pageId,
    );
    cy.wait("@createNewJSCollection").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      201,
    );
    ee.AssertEntityPresenceInExplorer("RenamedJSObjectCopy");
    jsEditor.validateDefaultJSObjProperties("RenamedJSObjectCopy");
  });

  it("4. Validate Rename JSObject from Entity Explorer", function() {
    jsEditor.RenameJSObjFromExplorer("RenamedJSObject", "ExplorerRenamed");
    ee.AssertEntityPresenceInExplorer("ExplorerRenamed");
    jsEditor.validateDefaultJSObjProperties("ExplorerRenamed");
  });

  it("5. Validate Move JSObject", function() {
    const newPageId = "Page2";
    ee.AddNewPage();
    ee.AssertEntityPresenceInExplorer(newPageId);
    ee.SelectEntityByName(pageId);
    ee.expandCollapseEntity("QUERIES/JS");
    ee.ActionContextMenuByEntityName(
      "RenamedJSObjectCopy",
      "Move to page",
      newPageId,
    );
    ee.SelectEntityByName(newPageId);
    ee.AssertEntityPresenceInExplorer("RenamedJSObjectCopy");
    jsEditor.validateDefaultJSObjProperties("RenamedJSObjectCopy");
  });

  it("6. Validate Deletion of JSObject", function() {
    ee.SelectEntityByName(pageId);
    ee.expandCollapseEntity("QUERIES/JS");
    ee.ActionContextMenuByEntityName(
      "ExplorerRenamed",
      "Delete",
      "Are you sure?",
    );
    ee.AssertEntityAbsenceInExplorer("ExplorerRenamed");
  });
});
