const pages = require("../../../../locators/Pages.json");
const queryLocators = require("../../../../locators/QueryEditor.json");
import ApiEditor from "../../../../locators/ApiEditor";

/* TO-DO
    4. Ensure the user is displayed appropriate error messages on the wrong field data
    5. Ensure Long body form is added
    6. Ensure use the method from the drop-down
    9. Ensure user is able to add special characters to the name from Pane
    10. Ensure user is able to save the queries
    12. Ensure user is able to edit the query pane and the changes get saved
    16. Ensure user is able to Name conventions that are appropriate when moved/Copied
*/

describe("Test ideas Query Pane  ", function() {
  before(() => {
    localStorage.setItem("ApiPaneV2", "ApiPaneV2");
    cy.NavigateToApiEditor();
    cy.get(pages.integrationCreateNew)
      .should("be.visible")
      .click({ force: true });
    cy.get(".tab-title").contains("Active");
    cy.get(".tab-title:contains('Active')").click();
  });

  it("1. Test user is displayed with following command", function() {
    /*
       1) Create Message    2) Delete Message
       3) Fetch Message     4) List Messages
       5) Schedule Message  6) Update Message
   */
    cy.contains(".t--datasource-name", "Test Airtable1.2")
      .find(queryLocators.createQuery)
      .click();

    cy.get(queryLocators.queryNameField).type("Test");
    cy.get(ApiEditor.airtableImage).click(); //Only to save the query name
    cy.get(ApiEditor.dropdownTypeAuth).click();
    cy.contains(ApiEditor.dropdownOption, "List Records").should("exist");
    cy.contains(ApiEditor.dropdownOption, "Create Records").should("exist");
    cy.contains(ApiEditor.dropdownOption, "Delete A Record").should("exist");
    cy.contains(ApiEditor.dropdownOption, "Retrieve A Record").should("exist");
    cy.contains(ApiEditor.dropdownOption, "Update Records").should("exist");

    /*Twilio
    cy.contains(ApiEditor.dropdownOption, "Create Message").should("exist");
    cy.contains(ApiEditor.dropdownOption, "Delete Message").should("exist");
    cy.contains(ApiEditor.dropdownOption, "Fetch Message").should("exist");
    cy.contains(ApiEditor.dropdownOption, "List Messages").should("exist");
    cy.contains(ApiEditor.dropdownOption, "Schedule Message").should("exist");
    cy.contains(ApiEditor.dropdownOption, "Update Message").should("exist");
    */
  });

  it("2. Test user is able to select Create message cmd and the following fields are displayed to the user", function() {
    /*
        1) Twilio Account SID     2) To 
        3) From                   4) Body
    */

    /*Twilio
    
    cy.contains(ApiEditor.dropdownOption, "Create Message").click();
    cy.get(ApiEditor.labelAuth).contains("Twilio Account SID").should("exist");
    cy.get(ApiEditor.labelAuth).contains("To").should("exist");
    cy.get(ApiEditor.labelAuth).contains("From").should("exist");
    cy.get(ApiEditor.labelAuth).contains("Body").should("exist");

    */
    cy.contains(ApiEditor.dropdownOption, "List Records").click();
    cy.get(ApiEditor.labelAuth)
      .contains("Base ID")
      .should("exist");
  });

  it("3. Test mandatory Fields are added in Created", function() {
    //cy.contains(ApiEditor.dropdownOption, "Create Records").click();
    cy.get(ApiEditor.labelAuth)
      .contains("Base ID")
      .should("exist");
    cy.get(".label-icon-wrapper:contains('Base ID')").contains("*");

    /*
    cy.get(".label-icon-wrapper:contains('Twilio Account SID')").contains("*");
    cy.get(".label-icon-wrapper:contains('To')").contains("*");
    cy.get(".label-icon-wrapper:contains('From')").contains("*");
    cy.get(".label-icon-wrapper:contains('Body')").contains("*");
    */
  });

  it("7. Test user is able to change the name from the pane", function() {
    cy.contains(".t--entity-item", "Test")
      .find(".entity-context-menu-icon")
      .click({ force: true });

    cy.selectAction("Edit Name");

    cy.contains(".t--entity-item", "Test").type("CREATE");

    cy.get(ApiEditor.airtableImage).click(); //Only to save the query name

    cy.contains(".t--entity-item", "CREATE").should("exist");
  });

  it("8. Test user is able to add longer name", function() {
    cy.contains(".t--entity-item", "CREATE")
      .find(".entity-context-menu-icon")
      .click({ force: true });

    cy.selectAction("Edit Name");

    cy.contains(".t--entity-item", "CREATE").type("CREATE MESSAGE TEST");

    cy.get(ApiEditor.airtableImage).click(); //Only to save the query name

    cy.contains(".t--entity-item", "CREATE_MESSAGE_TEST").should("exist");
  });

  it("10. Test user is able to save the queries", function() {
    //cy.get(ApiEditor.backBtn).click();
    //cy.contains(".t--entity action .ContextMenu", "New Query Test").should("exist");
    //cy.get(".whitespace-nowrap:contains('New Query Test')").should("exist");
    //cy.get(".t--entity-name:contains('New Query Test')").should("exist");
  });

  it("11. Test user is able to reopen the query pane", function() {
    cy.get(ApiEditor.backBtn).click();
    cy.contains(".t--entity-item", "CREATE_MESSAGE_TEST").click();
    cy.get(ApiEditor.airtableImage).should("exist");
    cy.contains(".bp3-editable-text-content", "CREATE_MESSAGE_TEST");
  });

  it("13. Test user is able to COPY query into the same page from Query Pane", function() {
    cy.contains(".t--entity-item", "CREATE_MESSAGE_TEST").click();
    cy.get(".t--more-action-menu").should("exist");
    cy.get(".t--more-action-menu").click({ multiple: true });
    cy.selectAction("Copy to page");
    cy.selectAction("Page1");
    cy.contains(".t--entity-item", "CREATE_MESSAGE_TESTCopy").should("exist");
  });

  it("14. Test user is able to COPY query into the Different page from Query Pane", function() {
    cy.Createpage("Page2");
    cy.contains(".t--entity-name", "Page1").click();

    cy.xpath(
      "//div[text()='QUERIES/JS']/ancestor::div/preceding-sibling::a[contains(@class, 't--entity-collapse-toggle')]",
    )
      .invoke("attr", "name")
      .then((arrow) => {
        cy.xpath(
          "//div[text()='QUERIES/JS']/ancestor::div/preceding-sibling::a[contains(@class, 't--entity-collapse-toggle')]",
        )
          .trigger("click", { multiple: true, force: true })
          .wait(1000);
      });

    cy.contains(".t--entity-item", "CREATE_MESSAGE_TEST").click();
    cy.get(".t--more-action-menu").should("exist");
    cy.get(".t--more-action-menu").click({ multiple: true });
    cy.selectAction("Copy to page");
    cy.selectAction("Page2");

    cy.contains(".t--entity-name", "Page2").click();
    cy.wait(1000);

    cy.xpath(
      "//div[text()='QUERIES/JS']/ancestor::div/preceding-sibling::a[contains(@class, 't--entity-collapse-toggle')]",
    )
      .invoke("attr", "name")
      .then((arrow) => {
        cy.xpath(
          "//div[text()='QUERIES/JS']/ancestor::div/preceding-sibling::a[contains(@class, 't--entity-collapse-toggle')]",
        ).trigger("click", { multiple: true, force: true });
      });
    cy.contains(".t--entity-item", "CREATE_MESSAGE_TESTCopy").should("exist");
  });

  it("15. Test user is able to MOVE query into the Different page from Query Pane", function() {
    cy.contains(".t--entity-name", "Page1").click();

    cy.xpath(
      "//div[text()='QUERIES/JS']/ancestor::div/preceding-sibling::a[contains(@class, 't--entity-collapse-toggle')]",
    )
      .invoke("attr", "name")
      .then((arrow) => {
        cy.xpath(
          "//div[text()='QUERIES/JS']/ancestor::div/preceding-sibling::a[contains(@class, 't--entity-collapse-toggle')]",
        )
          .trigger("click", { multiple: true, force: true })
          .wait(1000);
      });

    cy.contains(".t--entity-item", "CREATE_MESSAGE_TEST").click();
    cy.get(".t--more-action-menu").should("exist");
    cy.get(".t--more-action-menu").click({ multiple: true });
    cy.selectAction("Move to page");
    cy.selectAction("Page2");

    cy.contains(".t--entity-name", "Page2").click();
    cy.wait(1000);

    cy.xpath(
      "//div[text()='QUERIES/JS']/ancestor::div/preceding-sibling::a[contains(@class, 't--entity-collapse-toggle')]",
    )
      .invoke("attr", "name")
      .then((arrow) => {
        cy.xpath(
          "//div[text()='QUERIES/JS']/ancestor::div/preceding-sibling::a[contains(@class, 't--entity-collapse-toggle')]",
        ).trigger("click", { multiple: true, force: true });
      });

    cy.contains(".t--entity-item", "CREATE_MESSAGE_TEST").should("exist");
  });
});
