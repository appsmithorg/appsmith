import {
  entityExplorer,
  propPane,
  draggableWidgets,
  agHelper,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

describe(
  "Bug 25894 - Moustache brackets should be highlighted",
  { tags: ["@tag.JS", "@tag.Binding"] },
  () => {
    it("1. should show {{ }} in bold", () => {
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.BUTTON);
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);

      propPane.EnterJSContext(
        "onClick",
        `{{ Api1.run({
      "key": Button1.text
    }).then(() => {
      storeValue('my-secret-key', Button3.text);
      Query1.run();
    }).catch(() => {});const a = { a: "key"} }}`,
      );
      agHelper
        .GetElement("span")
        .filter((index, element) => {
          const text = Cypress.$(element).text();
          return text.includes("{{") || text.includes("{");
        })
        .should("have.class", "cm-binding-brackets");

      agHelper
        .GetElement("span")
        .filter((index, element) => {
          const text = Cypress.$(element).text();
          return text.includes("}}") || text.includes("}");
        })
        .should("have.class", "cm-binding-brackets"); // Check the class of filtered elements
    });
  },
);
