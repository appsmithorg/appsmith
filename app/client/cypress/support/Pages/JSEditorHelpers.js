import explorer from "../../locators/explorerlocators.json";

export default {
  createJSFile: () => {
    cy.get(explorer.createNew).click({ force: true });
    cy.get(explorer.newJSObject).click({ force: true });
    cy.get(".js-editor").find("");
  },
};
