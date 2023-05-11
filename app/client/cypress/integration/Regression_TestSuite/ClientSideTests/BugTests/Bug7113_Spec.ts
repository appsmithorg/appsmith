import * as _ from "../../../../support/Objects/ObjectsCore";

const { agHelper, entityExplorer, propPane } = _;

describe("Bug 7113 - Moustache brackets in bold", () => {
  it("should show {{ }} in bold", () => {
    cy.fixture("buttondsl").then((val: any) => {
      agHelper.AddDsl(val);
    });

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
