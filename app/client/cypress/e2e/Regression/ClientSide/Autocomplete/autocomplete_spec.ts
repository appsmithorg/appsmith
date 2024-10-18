import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";
import { agHelper } from "../../../../support/Objects/ObjectsCore";

const dynamicInputLocators = require("../../../../locators/DynamicInput.json");

describe(
  "Dynamic input autocomplete",
  { tags: ["@tag.JS", "@tag.Sanity", "@tag.Binding"] },
  () => {
    before(() => {
      agHelper.AddDsl("autocomp");
    });

    it("1. Opens autocomplete for bindings", () => {
      EditorNavigation.SelectEntityByName("Aditya", EntityType.Widget);
      EditorNavigation.SelectEntityByName("Button2", EntityType.Widget, {}, [
        "TestModal",
      ]);
      cy.testJsontext("label", "", {
        parseSpecialCharSequences: true,
      });
      cy.get(dynamicInputLocators.input)
        .first()
        .click({ force: true })
        .type("{uparrow}", { parseSpecialCharSequences: true })
        .type("{ctrl}{shift}{downarrow}", { parseSpecialCharSequences: true })
        .type("{backspace}", { parseSpecialCharSequences: true })
        .then(() => {
          cy.get(dynamicInputLocators.input)
            .first()
            .click({ force: true })
            .type("{{", {
              parseSpecialCharSequences: true,
            });

          // Tests if autocomplete will open
          cy.get(dynamicInputLocators.hints).should("exist");
          // Tests if data tree entities are sorted
          cy.get(`${dynamicInputLocators.hints} li`)
            .eq(1)
            .should("have.text", "Button1.text");
          cy.testJsontext("label", "", {
            parseSpecialCharSequences: true,
          });
        });
    });

    it("2. Test if action inside non event field throws error & open current value popup", () => {
      cy.get(dynamicInputLocators.input)
        .first()
        .click({ force: true })
        .type("{backspace}".repeat(12))
        .type("{{storeValue()}}", { parseSpecialCharSequences: false });
      cy.evaluateErrorMessage(
        "Please remove any direct/indirect references to {{actionName}} and try again. Data fields cannot execute framework actions.".replaceAll(
          "{{actionName}}",
          "storeValue()",
        ),
      );
    });
  },
);
