/* eslint-disable cypress/no-unnecessary-waiting */
/* eslint-disable cypress/no-assigning-return-values */

require("cy-verify-downloads").addCustomCommand();
require("cypress-file-upload");

const oidcform = require("../locators/OIDCForm.json");
const oidcData = require("../fixtures/oidcSource.json");

function deleteScope(N) {
  // if N is zero, nothing to delete
  if (N === 0) {
    return;
  }
  // delete one element
  cy.get("button.bp3-tag-remove").click({ force: true, multiple: true });
  // fetch the list items; there should be N - 1 items
  cy.get(".bp3-tag").should("have.length", N - 1);
  deleteScope(N - 1);
}

Cypress.Commands.add("fillOIDCFormPartly", () => {
  cy.get(oidcform.clientID).type(oidcData.clientID);
  cy.get(oidcform.clientSecret).type(oidcData.clientSecret);
  cy.get(oidcform.saveBtn).click({ force: true });
});

Cypress.Commands.add("fillOIDCform", () => {
  cy.get(oidcform.clientID)
    .clear()
    .type(oidcData.clientID);
  cy.get(oidcform.clientSecret)
    .clear()
    .type(oidcData.clientSecret);
  cy.get(oidcform.authorizationURL)
    .clear()
    .type(oidcData.authorizationURL);
  cy.get(oidcform.tokenURL)
    .clear()
    .type(oidcData.tokenURL);
  cy.get(oidcform.userInfo)
    .clear()
    .type(oidcData.userInfo);
  cy.get(oidcform.jwtSetURI)
    .clear()
    .type(oidcData.jwtSetURI);
  cy.get(oidcform.scope)
    .get(".bp3-tag")
    .its("length")
    .then((N) => {
      deleteScope(N);
    });
  cy.get(oidcform.scope).type(oidcData.scope);
  cy.get(oidcform.userAttribute)
    .clear()
    .type(oidcData.userAttribute);
  cy.get(".openid_tag").within(() => {
    cy.get("button.bp3-tag-remove").should("not.be.visible");
  });
  cy.get(oidcform.saveBtn).click({ force: true });
});
