export default {
  switchToPage: (pageName) => {
    cy.get(`.t--entity-name:contains(${pageName})`).click({ force: true });
  },
};
