/* eslint-disable cypress/no-unnecessary-waiting */
/* eslint-disable cypress/no-assigning-return-values */

require("cy-verify-downloads").addCustomCommand();
require("cypress-file-upload");

const samlForm = require("../locators/SAMLForm.json");

Cypress.Commands.add("fillSamlForm", (type) => {
  if (type === "URL") {
    cy.get(samlForm.redirectURL).should(
      "have.value",
      Cypress.env("OAUTH_SAML_REDIRECT_URL"),
    );
    cy.get(samlForm.entityID).should(
      "have.value",
      Cypress.env("OAUTH_SAML_ENTITY_ID"),
    );
    cy.get(samlForm.metadataURL).type(Cypress.env("OAUTH_SAML_METADATA_URL"));
    cy.get(samlForm.saveBtn).click({ force: true });
  } else if (type === "XML") {
    cy.get(samlForm.redirectURL).should(
      "have.value",
      Cypress.env("OAUTH_SAML_REDIRECT_URL"),
    );
    cy.get(samlForm.entityID).should(
      "have.value",
      Cypress.env("OAUTH_SAML_ENTITY_ID"),
    );
    cy.get(samlForm.metadataXML).type(Cypress.env("OAUTH_SAML_METADATA_XML"));
    cy.get(samlForm.saveBtn).click({ force: true });
  } else if (type === "IdP") {
    cy.get(samlForm.redirectURL).should(
      "have.value",
      Cypress.env("OAUTH_SAML_REDIRECT_URL"),
    );
    cy.get(samlForm.editEntityId).should(
      "have.value",
      Cypress.env("OAUTH_SAML_ENTITY_ID"),
    );
    cy.get(samlForm.ssoURL).type(Cypress.env("OAUTH_SAML_SSO_URL"));
    cy.get(samlForm.pubCert).type(Cypress.env("OAUTH_SAML_PUB_CERT"));
    cy.get(samlForm.email).type(Cypress.env("OAUTH_SAML_EMAIL"));
    cy.get(samlForm.saveBtn).click({ force: true });
  }
});
