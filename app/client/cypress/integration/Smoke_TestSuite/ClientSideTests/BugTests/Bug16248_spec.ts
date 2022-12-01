import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const gitSync = ObjectsRegistry.GitSync,
  apiPage = ObjectsRegistry.ApiPage;

describe("Block Shortcut Action Execution", function() {
  it("Bug 16248, When GitSync modal is open, block action execution", function() {
    const largeResponseApiUrl = "https://jsonplaceholder.typicode.com/users";
    const modifierKey = Cypress.platform === "darwin" ? "meta" : "ctrl";

    apiPage.CreateAndFillApi(largeResponseApiUrl, "GitSyncTest");
    gitSync.openGitSyncModal();
    cy.get("body").type(`{${modifierKey}}{enter}`);
    cy.get("@postExecute").should("not.exist");
    gitSync.closeGitSyncModal();
    cy.get("body").type(`{${modifierKey}}{enter}`);
    cy.wait("@postExecute");
  });
});
