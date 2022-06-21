const datasourceEditor = require("../../../../locators/DatasourcesEditor.json");
const apiwidget = require("../../../../locators/apiWidgetslocator.json");
const pages = require("../../../../locators/Pages.json");
const datasource = require("../../../../fixtures/datasources.json");
import ApiEditor from "../../../../locators/ApiEditor";


describe("Airtable Active datasource test cases", function() {
  before(() => {
    localStorage.setItem("ApiPaneV2", "ApiPaneV2");
    cy.NavigateToApiEditor();
    cy.get(pages.integrationCreateNew)
      .should("be.visible")
      .click({ force: true });
  });

  it("1. Test user is displayed with Twilio setup on Datasource page along with the symbol", function() {
    cy.get(datasourceEditor.Airtable).should("exist");
    cy.get(ApiEditor.airtableImage).should("be.visible");

  });

  it("2. Test user is able to click on the Twilio for establishing a connection", function() {
    cy.get(datasourceEditor.Airtable).click();  
  });

  it("3. Test user is displayed with Auth type and user is able to select Basic Auth", function() {

    cy.get(ApiEditor.dropdownTypeAuth).click();
    //cy.contains(ApiEditor.test, 'Basic Auth').click()
    cy.contains(ApiEditor.dropdownOption, 'Bearer Token').click();
    //cy.get(".cs-text").should('have.value', 'Bearer Token');

  });

  it("4. Test selection user must be displayed with Username and Password", function() {

    cy.get(ApiEditor.labelAuth).contains("Bearer Token");
    //cy.get(ApiEditor.labelAuth).contains("Username");
    //cy.get(ApiEditor.labelAuth).contains("Password");
    
  });

  it("5. Test user is displayed with following button", function() {

    /*5. Ensure user is displayed with following button 
          1) Delete   2) Test (Non -Functional)
          3) Save     4) Twilio Logo
          5) Edit name of Datasource  
          6) Back option
    */
    cy.get(".bp3-button:contains('Delete')").should("exist");
    //Test (Non -Functional) ???
    cy.get(apiwidget.saveButton).should("exist");
    cy.get("[alt='Datasource']").should("be.visible");
    cy.get(datasourceEditor.datasourceTitle).should("exist");
    cy.get(datasourceEditor.datasourceTitle).type("Test Airtable1.2");
    cy.get(ApiEditor.backBtn).should("exist");

  });

  it("6. Test clicking on Save option the DS gets saved", function() {

    cy.get('input[name="datasourceConfiguration.authentication.bearerToken"]').type(datasource.bearerToken);
    cy.get('input[name="datasourceConfiguration.authentication.bearerToken"]').should('have.value', datasource.bearerToken);
   
    cy.get(".bp3-button-text:contains('Save')").click();
     

    /*cy.RunAPI();
    cy.ResponseStatusCheck("200 OK");
    cy.get(ApiEditor.formActionButtons).should("be.visible");
    cy.get(ApiEditor.ApiActionMenu)
      .first()
      .click();
    cy.get(ApiEditor.ApiDeleteBtn).click();
    cy.get(ApiEditor.ApiDeleteBtn)
      .contains("Are you sure?")
      .click();
    cy.wait("@deleteAction");
    cy.get("@deleteAction").then((response) => {
      cy.expect(response.response.body.responseMeta.success).to.eq(true);
    });*/

    /*cy.importCurl();
    cy.get("@curlImport").then((response) => {
      cy.expect(response.response.body.responseMeta.success).to.eq(true);
      cy.get(apiwidget.ApiName)
        .invoke("text")
        .then((text) => {
          const someText = text;
          expect(someText).to.equal(response.response.body.data.name);
        });
    });*/

  });

 /* it("7. Test clicking on Delete the DS gets deleted", function() {
    //cy.get(".bp3-button:contains('Delete')").click();
  });

  it("8. Test  delete if the DS is associated with a query the DS must show an error and unable to delete", function() {
    //TODO
  });

  it("9. Test Password is encrypted", function() {
    //cy.get("[alt='Datasource']").click();
  });

  it("10. Test clicking on the back button user should be navigated to the active Datasources page", function() {

    cy.get(ApiEditor.backBtn).click();
    cy.get(".t--integrationsHomePage").should("exist");
    cy.get(".sectionHeadings").contains("Datasource");

  });*/

});
