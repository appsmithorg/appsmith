const datasourceEditor = require("../../../../locators/DatasourcesEditor.json");
const apiwidget = require("../../../../locators/apiWidgetslocator.json");
const pages = require("../../../../locators/Pages.json");
const datasource = require("../../../../fixtures/datasources.json");
const queryLocators = require("../../../../locators/QueryEditor.json");
import ApiEditor from "../../../../locators/ApiEditor";

describe("Twilio Active datasource test cases", function() {
  before(() => {
    localStorage.setItem("ApiPaneV2", "ApiPaneV2");
    cy.NavigateToApiEditor();
    cy.get(pages.integrationCreateNew)
      .should("be.visible")
      .click({ force: true });
  });

  it("1. Test user is displayed with Twilio setup on Datasource page along with the symbol", function() {
    cy.get(datasourceEditor.Twilio).should("exist");
    cy.get(ApiEditor.twilioImage).should("be.visible");
  });

  it("2. Test user is able to click on the Twilio for establishing a connection", function() {
    cy.get(datasourceEditor.Twilio).click();
    cy.get(".t--json-to-form-wrapper").should("exist");
  });

  it("3. Test user is displayed with Auth type and user is able to select Basic Auth", function() {
    cy.get(ApiEditor.dropdownTypeAuth).click();
    cy.contains(ApiEditor.test, "Basic Auth").click();
  });

  it("4. Test selection user must be displayed with Username and Password", function() {
    cy.get(ApiEditor.labelAuth).contains("Account SID");
    cy.get(ApiEditor.labelAuth).contains("Auth Token");
  });

  it("5. Test user is displayed with following button", function() {
    /*5. Ensure user is displayed with following button 
          1) Delete   2) Test (Non -Functional)
          3) Save     4) Twilio Logo
          5) Edit name of Datasource  
          6) Back option
    */
    cy.get(".bp3-button:contains('Delete')").should("exist");
    /* Test button has not been added to Create DataSource Page for SaaS Plugins
       cy.get(".t--test-datasource").should("exist"); 
    */
    cy.get(apiwidget.saveButton).should("exist");
    cy.get("[alt='Datasource']").should("be.visible");
    cy.get(datasourceEditor.datasourceTitle).should("exist");
    cy.get(datasourceEditor.datasourceTitle).type("Test Twilio");
    cy.get(ApiEditor.backBtn).should("exist");
  });

  it("6. Test clicking on Save option the DS gets saved", function() {
    cy.get(
      'input[name="datasourceConfiguration.authentication.username"]',
    ).type(datasource.username);
    cy.get(
      'input[name="datasourceConfiguration.authentication.username"]',
    ).should("have.value", datasource.username);

    cy.get(
      'input[name="datasourceConfiguration.authentication.password"]',
    ).type(datasource.password);
    cy.get(
      'input[name="datasourceConfiguration.authentication.password"]',
    ).should("have.value", datasource.password);

    cy.get(".bp3-button-text:contains('Save')").click();

    cy.wait("@saveDatasource").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
  });

  it("7. Test clicking on Delete the DS gets deleted", function() {
    cy.get(pages.integrationCreateNew)
      .should("be.visible")
      .click({ force: true });

    cy.get(datasourceEditor.Twilio).click();

    cy.get(".t--delete-datasource").click();
    cy.get(".t--delete-datasource")
      .contains("Are you sure?")
      .click();
    cy.wait("@deleteDatasource").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
  });

  it("8. Test  delete if the DS is associated with a query the DS must show an error and unable to delete", function() {
    cy.contains(".t--datasource-name", "Test Twilio")
      .find(queryLocators.createQuery)
      .click();
    cy.get(queryLocators.queryNameField).type("Test");
    cy.get(ApiEditor.twilioImage).click(); //Only to save the query name
    cy.get(ApiEditor.backBtn).click();

    cy.contains(".t--datasource-name", "Test Twilio").click();
    cy.get(".t--delete-datasource").click();
    cy.get(".t--delete-datasource")
      .contains("Are you sure?")
      .click();
    cy.wait("@deleteDatasource").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      409,
    );
  });

  it("9. Test Password is encrypted", function() {
    cy.get(ApiEditor.dropdownTypeAuth).click();
    cy.contains(ApiEditor.test, "Basic Auth").click();
    cy.get("[type='password']").should("exist");
  });

  it("10. Test clicking on the back button user should be navigated to the active Datasources page", function() {
    cy.get(ApiEditor.backBtn).click();
    cy.get(".t--integrationsHomePage").should("exist");
    cy.get(".sectionHeadings").contains("Datasource");
  });
});
