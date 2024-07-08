import {
  agHelper,
  draggableWidgets,
  entityExplorer,
  propPane,
} from "../../../../../support/Objects/ObjectsCore";

import { buttongroupwidgetlocators } from "../../../../../locators/WidgetLocators";

describe(
  "tests for the button group when the button and menu items had dupliacte labels",
  { tags: ["@tag.Widget", "@tag.Button"] },
  () => {
    before("Login to the app and navigate to the workspace", function () {
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.BUTTON_GROUP);
    });
    it("change the 2nd button label to the same as the first button and verify the duplicate label error", () => {
      agHelper.GetNClick(buttongroupwidgetlocators.buttongroup);
      agHelper.GetNClick(propPane._tableEditColumnButton, 1);
      propPane.UpdatePropertyFieldValue("Text", "Favorite");
      agHelper.GetNClick(propPane._goBackToProperty);
      const inputField = agHelper.GetElement(
        ".has-duplicate-label input[type='text']",
        "noVerify",
      );
      cy.wait(1000);
      inputField.should("have.css", "border-color", "rgb(255, 180, 180)");
    });
  },
);
