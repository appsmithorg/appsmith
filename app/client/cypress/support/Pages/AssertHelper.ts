import "cypress-wait-until";
import { ObjectsRegistry } from "../Objects/Registry";

export class AssertHelper {
  private locator = ObjectsRegistry.CommonLocators;
  public _modifierKey = Cypress.platform === "darwin" ? "meta" : "ctrl";

  public isMac = Cypress.platform === "darwin";

  public AssertDocumentReady() {
    cy.waitUntil(() =>
      //cy.document().then((doc) => doc.readyState === "complete"),
      cy.document().should((doc) => {
        expect(doc.readyState).to.equal("complete");
      }),
    );
    cy.window().should("have.property", "onload");
  }
}
