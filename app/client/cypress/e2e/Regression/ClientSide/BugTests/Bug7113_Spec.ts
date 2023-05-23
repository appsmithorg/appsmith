import { WIDGET } from "../../../../locators/WidgetLocators";
import * as _ from "../../../../support/Objects/ObjectsCore";

const { entityExplorer, propPane } = _;

describe("Bug 7113 - Moustache brackets in bold", () => {
  it("1. should show {{ }} in bold", () => {
    entityExplorer.DragDropWidgetNVerify(WIDGET.BUTTON, 200, 200);

    entityExplorer.SelectEntityByName("Button1", "Widgets");

    propPane.EnterJSContext(
      "onClick",
      `{{Api1.run({
      "key": Button1.text
    }).then(() => {
      storeValue('my-secret-key', Button3.text);
      Query1.run();
    }).catch(() => {});const a = { a: "key"} }}`,
    );

    cy.get("span").contains("{{").should("have.class", "binding-brackets");
    cy.get("span").contains("}}").should("have.class", "binding-brackets");
  });
});
