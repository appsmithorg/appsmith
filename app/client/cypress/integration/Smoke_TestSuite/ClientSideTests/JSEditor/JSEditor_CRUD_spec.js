import {
  default as JSEditorHelpers,
  testingFileText,
} from "../../../../support/Pages/JSEditorHelpers";
import PageHelpers from "../../../../support/Pages/PageHelpers";

describe("JSEditor_CRUD", () => {
  it("creates a JS Editor File", () => {
    JSEditorHelpers.createJSFile();
  });
  it("edit a JS Editor File", () => {
    JSEditorHelpers.editJSFile(testingFileText);
  });
  it("copy/move JS Editor file", () => {
    // Create a new page
    cy.Createpage("SecondPage");
    PageHelpers.switchToPage("Page1");
    cy.SearchEntityandOpen("JSObject1");
    // copy file
    JSEditorHelpers.copyFileTo("Page1");
    JSEditorHelpers.moveFileTo("SecondPage");
  });
  it("delete JS Editor file", () => {
    JSEditorHelpers.deleteFile();
  });
});
