import { jsEditor } from "../../../../support/Objects/ObjectsCore";

describe(
  "To test [Bug]: Action redesign: Focus shifts to another tab when renaming a JSObject #38207",
  { tags: ["@tag.JS"] },
  () => {
    it("1. Validate that focus does not shift to another tab while renaming JS Objects from the context menu", () => {
      // Create first JS file
      jsEditor.CreateJSObject("", { prettify: false, toRun: false });

      // Rename the first JS Object
      jsEditor.RenameJSObjectFromContextMenu("ChangedName1");

      // Validate the new name of the JS Object
      cy.get(jsEditor.listOfJsDismissibleTabs).eq(0).contains("ChangedName1");

      // Create second JS file
      jsEditor.CreateJSObject("", { prettify: false, toRun: false });

      // Create third JS file
      jsEditor.CreateJSObject("", { prettify: false, toRun: false });

      // Rename the third JS Object
      jsEditor.RenameJSObjectFromContextMenu("ChangedName3");

      // Validate the new name of the 3rd JS Objcte
      cy.get(jsEditor.listOfJsDismissibleTabs).eq(2).contains("ChangedName3");
    });
  },
);
