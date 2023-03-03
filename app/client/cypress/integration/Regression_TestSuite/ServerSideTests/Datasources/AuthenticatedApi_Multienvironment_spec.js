const apiwidget = require("../../../../locators/apiWidgetslocator.json");
const api = require("../../../../locators/AuthenticatedApi.json");

describe("Authenticated API Datasource", function() {
    it("Validating OAuth", function() {
        cy.NavigateToAPI_Panel();
        cy.get(apiwidget.createAuthApiDatasource).click();
        cy.renameDatasource("FakeAuthenticatedApi1");
        cy.fillAuthenticatedAPIForm();
        cy.get(api.authenticationType).click();
        cy.get(api.dropDownOption).contains("OAuth 2.0").click();
        cy.get(api.authenticationSection).should("be.visible");
        cy.get(api.grantType).click();
        cy.get(api.dropDownOption).should("contain.text", "Client Credentials")
            .and("contain.text", "Authorization Code");
        cy.get(api.dropDownOption).contains("Client Credentials").click();
        cy.get(api.addAccessToken).click();
        cy.get(api.dropDownOption).should("contain.text", "Request Header")
            .and("contain.text", "Request URL");
        cy.get(api.headerPrefix).should("be.visible");
        cy.get(api.accessTokenUrl).type("https://example.com");
        cy.get(api.clientId).type("1234");
        cy.get(api.clientSecret).type("abcd");
        cy.get(api.scopeString).type("read");
        cy.get(api.authentication).click();
        cy.get(api.dropDownOption).should("contain.text", "Send as Basic Auth header")
            .and("contain.text", "Send client credentials in body");
        cy.get(api.dropDownOption).contains("Send client credentials in body").click();  
        cy.get(api.authenticationAudience).type("https://example.com/oauth/audience");
        cy.get(api.authenticationResource).type("https://example.com/oauth/resource");
        cy.saveDatasource();
        cy.get(api.editDatasource).click();
        cy.get(api.editDatasource).click();

        cy.fillAuthenticatedApiEnvironmentDetails();
        cy.get(api.bindValues).click({force: true});
        // cy.get(api.editDatasource).click();
        // cy.get(api.expandMore)
        //     .first()
        //     .click({ force: true });
        // cy.get(api.stagingOption).click({ force: true });
        // cy.fillAuthenticatedApiEnvironmentDetailsStaging();
        cy.deleteDatasource("FakeAuthenticatedApi");        
    });
})