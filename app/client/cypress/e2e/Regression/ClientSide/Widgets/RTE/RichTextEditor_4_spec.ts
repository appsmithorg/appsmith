import { agHelper, propPane } from "../../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";

describe(
  "Rich Text Editor widget Tests",
  { tags: ["@tag.Widget", "@tag.TextEditor"] },
  function () {
    before(() => {
      agHelper.AddDsl("richTextEditorDsl");
      EditorNavigation.SelectEntityByName("RichTextEditor1", EntityType.Widget);
    });

    it("1. Verify updating disable plugin types updates toolbar buttons in widget", function () {
      propPane.EnterJSContext("Disabled plugin types", `["bold"]`);
      cy.get('[data-mce-name="bold"]').should("not.exist");
    });
  },
);
