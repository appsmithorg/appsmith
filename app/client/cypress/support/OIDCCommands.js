/* eslint-disable cypress/no-unnecessary-waiting */
/* eslint-disable cypress/no-assigning-return-values */

require("cy-verify-downloads").addCustomCommand();
require("cypress-file-upload");

const oidcform = require("../locators/OIDCForm.json");
const oidcData = require("../fixtures/oidcSource.json");

Cypress.Commands.add("fillOIDCform", () => {
  cy.get(oidcform.clientID).type(oidcData.clientID);
  cy.get(oidcform.clientSecret).type(oidcData.clientSecret);
  cy.get(oidcform.authorizationURL).type(oidcData.authorizationURL);
  cy.get(oidcform.tokenURL).type(oidcData.tokenURL);
  cy.get(oidcform.userInfo).type(oidcData.userInfo);
  cy.get(oidcform.jwtSetURI).type(oidcData.jwtSetURI);
  cy.xpath(oidcform.AdvancedOptionExpand).click({ force: true });
  cy.get(oidcform.scope).type(oidcData.scope);
  cy.get(oidcform.userAttribute).type(oidcData.userAttribute);
  cy.get(oidcform.saveBtn).click({ force: true });
});
