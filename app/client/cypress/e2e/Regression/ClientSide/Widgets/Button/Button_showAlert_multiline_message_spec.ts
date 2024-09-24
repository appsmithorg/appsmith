import {
  draggableWidgets,
  entityExplorer,
  propPane,
  agHelper,
} from "../../../../../support/Objects/ObjectsCore";

describe(
  "Tests for showAlert message with newline characters in the alert message",
  { tags: ["@tag.Widget", "@tag.Button"] },
  () => {
    before("Login to the app and navigate to the workspace", function () {
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.BUTTON);
    });

    it("Verify showAlert message renders correctly with newline characters", () => {
      propPane.EnterJSContext("onClick", "showAlert(`sai\n\nprabhu`)");
      agHelper.ClickButton("Submit");
      cy.get(".Toastify", { timeout: 1000 }).should(
        "have.text",
        "sai\n\nprabhu",
      );
    });
  },
);
