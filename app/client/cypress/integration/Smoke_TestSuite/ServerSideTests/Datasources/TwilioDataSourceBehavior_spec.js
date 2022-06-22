const pages = require("../../../../locators/Pages.json");
const queryLocators = require("../../../../locators/QueryEditor.json");
import ApiEditor from "../../../../locators/ApiEditor";

describe("Tests on active datasource behaviour ", function() {
  before(() => {
    localStorage.setItem("ApiPaneV2", "ApiPaneV2");
    cy.NavigateToApiEditor();
    cy.get(pages.integrationCreateNew)
      .should("be.visible")
      .click({ force: true });
    cy.get(".tab-title").contains("Active");
    cy.get(".tab-title:contains('Active')").click();
  });

  it("1. Test to check that the saved Twilio is displayed under the Active tab section", function() {
    cy.contains(".t--datasource-name", "Test Airtable1.2");
    cy.get(".t--datasource-name:contains('Test Airtable1.2')").should("exist");
  });

  it("2. Test that buttons displayed in for Twilio", function() {
    /* 1 - Generate CURD (Inactive)
       2 - New Query
       3 - Action Icon
           a) Edit b) Delete
    */
    cy.contains(".t--datasource-name", "Test Airtable1.2")
      .find(queryLocators.createQuery)
      .should("be.visible");

    cy.contains(".t--datasource-name", "Test Airtable1.2")
      .find(".t--datasource-menu-option")
      .click();

    cy.get(".t--datasource-option-edit").should("exist");
    cy.get(".t--datasource-option-delete").should("exist");
  });

  it("3. Test clicking on New Query user must be navigated to Query Pane", function() {
    cy.contains(".t--datasource-name", "Test Airtable1.2")
      .find(queryLocators.createQuery)
      .click();

    cy.contains(".tab-title", "Query").should("exist");
  });

  it("5/6. Test ensure that the existing Query must not be deleted", function() {
    cy.get(ApiEditor.backBtn).click();

    cy.contains(".t--datasource-name", "Test Airtable1.2").click();
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

  it("7. Test clicking on Edit option of the action icon it is observed that the user is navigated into Datasource pane", function() {
    cy.get(ApiEditor.backBtn).click();

    cy.contains(".t--datasource-name", "Test Airtable1.2")
      .find(".t--datasource-menu-option")
      .click();

    cy.get(".t--datasource-option-edit").click();
    cy.get(".t--json-to-form-wrapper").should("be.visible");
  });
});
