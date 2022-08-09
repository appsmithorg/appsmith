const pages = require("../../../../locators/Pages.json");
const queryLocators = require("../../../../locators/QueryEditor.json");
const datasource = require("../../../../fixtures/datasources.json");

import ApiEditor from "../../../../locators/ApiEditor";

describe("Test Query Pane  ", function() {
  before(() => {
    localStorage.setItem("ApiPaneV2", "ApiPaneV2");
    cy.NavigateToApiEditor();
    cy.get(pages.integrationCreateNew)
      .should("be.visible")
      .click({ force: true });

    //If the datasource does not exist
    cy.createTwilioDatasource();
  });

  it("1. Test user is displayed with following command", function() {
    /*
       1) Create Message    2) Delete Message
       3) Fetch Message     4) List Messages
       5) Schedule Message  6) Update Message
   */
    cy.contains(".t--datasource-name", "Test Twilio")
      .find(queryLocators.createQuery)
      .click();

    cy.get(queryLocators.queryNameField).type("Test");
    cy.get(ApiEditor.twilioImage).click(); //Only to save the query name
    cy.get(ApiEditor.dropdownActions).click();
    cy.contains(ApiEditor.dropdownOption, "Create Message").should("exist");
    cy.contains(ApiEditor.dropdownOption, "Schedule Message").should("exist");
    cy.contains(ApiEditor.dropdownOption, "List Message").should("exist");
    cy.contains(ApiEditor.dropdownOption, "Fetch Message").should("exist");
    cy.contains(ApiEditor.dropdownOption, "Delete Message").should("exist");
    cy.contains(ApiEditor.dropdownOption, "Update Message").should("exist");
  });

  it("2. Test user is able to select Create message cmd and the following fields are displayed to the user", function() {
    /*
       1) Twilio Account SID     2) To 
        3) From                   4) Body
    */

    cy.contains(ApiEditor.dropdownOption, "Create Message").click();
    cy.get(ApiEditor.labelAuth)
      .contains("Twilio Account SID")
      .should("exist");
    cy.get(ApiEditor.labelAuth)
      .contains("To")
      .should("exist");
    cy.get(ApiEditor.labelAuth)
      .contains("From")
      .should("exist");
    cy.get(ApiEditor.labelAuth)
      .contains("Body")
      .should("exist");
  });

  it("3. Test mandatory Fields are added in Created", function() {
    cy.get(ApiEditor.labelAuth)
      .contains("Twilio Account SID")
      .should("exist");

    cy.get(
      ".StyledFormComponents__StyledFormLabel-kjor6s-6:contains('Twilio Account SID')",
    ).contains("*");
    cy.get(
      ".StyledFormComponents__StyledFormLabel-kjor6s-6:contains('To')",
    ).contains("*");
    cy.get(
      ".StyledFormComponents__StyledFormLabel-kjor6s-6:contains('From')",
    ).contains("*");
    cy.get(
      ".StyledFormComponents__StyledFormLabel-kjor6s-6:contains('Body')",
    ).contains("*");
  });

  it("4. Test the user is displayed appropriate error messages on the wrong field data", function() {
    const runQueryBtn = ".t--run-query";

    cy.get(runQueryBtn).click();

    cy.get(".t--query-error").contains(
      '"message":"The requested resource /2010-04-01/Accounts/Messages.json was not found',
    );

    cy.get(".CodeMirror-code")
      .first()
      .type(datasource["twilio-username"]);

    cy.get(runQueryBtn).click();

    cy.get(".t--query-error").contains(
      '"message":"A \'To\' phone number is required."',
    );

    cy.get(".CodeMirror-code") /*To*/
      .eq(1)
      .type("+14108675310");

    cy.get(runQueryBtn).click();

    cy.get(".t--query-error").contains(
      '"message":"A \'From\' phone number is required."',
    );

    cy.get(".CodeMirror-code") /*From*/
      .eq(2)
      .type("+15005550006");

    cy.get(runQueryBtn).click();

    cy.get(".t--query-error").contains('"message":"Message body is required."');
  });

  it("5. Test Ensure Long body form is added", function() {
    cy.get(ApiEditor.dropdownActions).click();
    cy.get(ApiEditor.dropdownOption)
      .contains("Create Message")
      .click();

    const longBody =
      "This is a long text to test if a long entry with more than 500 characters works well. This is a long text to test if a long entry with more than 500 characters works well. This is a long text to test if a long entry with more than 500 characters works well. This is a long text to test if a long entry with more than 500 characters works well. This is a long text to test if a long entry with more than 500 characters works well. This is a long text to test if a long entry with more than 500 characters works well.";

    cy.get(".CodeMirror-code")
      .last()
      .type(longBody);
    cy.get(ApiEditor.backBtn).click();

    cy.contains(".t--entity-item", "Test").click();
    cy.contains(".CodeMirror-code", longBody)
      .last()
      .should("exist");
  });

  it("6. Test use the method from the drop-down", function() {
    const dropdown = '[style="width: 100%;"]';
    cy.contains(dropdown, "Create Message")
      .should("exist")
      .click();
    cy.contains(ApiEditor.dropdownOption, "Schedule Message").click();
    cy.contains(dropdown, "Schedule Message")
      .should("exist")
      .click();
    cy.contains(ApiEditor.dropdownOption, "Create Message").click();

    cy.contains(dropdown, "Create Message").should("exist");
    cy.contains(dropdown, "Schedule Message").should("not.exist");
  });

  it("7. Test user is able to change the name from the pane", function() {
    cy.contains(".t--entity-item", "Test")
      .find(".entity-context-menu-icon")
      .click({ force: true });

    cy.selectAction("Edit Name");

    cy.contains(".t--entity-item", "Test").type("CREATE");

    cy.get(ApiEditor.twilioImage).click(); //Only to save the query name

    cy.contains(".t--entity-item", "CREATE").should("exist");
  });

  it("8. Test user is able to add longer name", function() {
    cy.contains(".t--entity-item", "CREATE")
      .find(".entity-context-menu-icon")
      .click({ force: true });

    cy.selectAction("Edit Name");

    cy.contains(".t--entity-item", "CREATE").type("CREATE MESSAGE TEST1");

    cy.get(ApiEditor.twilioImage).click(); //Only to save the query name

    cy.contains(".t--entity-item", "CREATE_MESSAGE_TEST1").should("exist");
  });

  it("9. Test user is able to add special characters to the name from Pane", function() {
    cy.get(ApiEditor.backBtn).click();
    cy.NavigateToApiEditor();

    cy.get(".tab-title").contains("Active");
    cy.get(".tab-title:contains('Active')").click();

    cy.contains(".t--datasource-name", "Test Twilio")
      .find(queryLocators.createQuery)
      .click();

    cy.get(queryLocators.queryNameField).type("CREATE_MESSAGE_TEST2");
    cy.get(ApiEditor.twilioImage).click(); //Only to save the query name
    cy.wait(3000);

    cy.contains(".t--entity-item", "CREATE_MESSAGE_TEST2")
      .find(".entity-context-menu-icon")
      .click({ force: true });

    cy.selectAction("Edit Name");

    cy.contains(".t--entity-item", "CREATE_MESSAGE_TEST2").type(
      "CREATE@MESSAGE~TEST$%&/()!*#",
    );
    cy.get("[alt='entityIcon']").click({ multiple: true }); //Only to save the query name
    cy.wait(2000);

    cy.contains(".t--entity-item", "CREATE@MESSAGE~TEST$%&/()!*#").should(
      "not.exist",
    );
    cy.contains(".t--entity-item", "CREATE_MESSAGE_TEST_________").should(
      "exist",
    );
  });

  it("10. Test user is able to save the queries", function() {
    cy.contains(".t--entity-item", "CREATE_MESSAGE_TEST1")
      .find(".entity-context-menu-icon")
      .click({ force: true });

    cy.selectAction("Edit Name");

    cy.contains(".t--entity-item", "CREATE_MESSAGE_TEST1").type(
      "CREATE MESSAGE TEST",
    );

    cy.get(ApiEditor.twilioImage).click(); //Only to save the query name

    cy.contains(".t--entity-item", "CREATE_MESSAGE_TEST").should("exist");
    cy.wait(2000);
  });

  it("11. Test user is able to reopen the query pane", function() {
    cy.get(ApiEditor.backBtn).click();
    cy.contains(".t--entity-item", "CREATE_MESSAGE_TEST").click();
    cy.get(ApiEditor.twilioImage).should("exist");
    cy.contains(".bp3-editable-text-content", "CREATE_MESSAGE_TEST");
  });

  it("12. Test user is able to edit the query pane and the changes get saved", function() {
    cy.NavigateToApiEditor();

    cy.get("[data-cy=t--tab-ACTIVE]").click();

    cy.contains(".t--datasource-name", "Test Twilio")
      .find(queryLocators.createQuery)
      .click();

    cy.get(queryLocators.queryNameField).type("Test");
    cy.get(ApiEditor.twilioImage).click(); //Only to save the query name
    cy.get(ApiEditor.dropdownActions).click();
    cy.contains(ApiEditor.dropdownOption, "List Message").click();

    cy.get(".CodeMirror-code")
      .first()
      .type("+123456789");
    cy.get(".CodeMirror-code")
      .last()
      .type("ACXXXXXXXXX");

    cy.get(ApiEditor.backBtn).click();

    cy.contains(".t--entity-item", "Test").click();

    cy.contains(".CodeMirror-code", "+123456789")
      .first()
      .should("exist");
    cy.contains(".CodeMirror-code", "ACXXXXXXXXX")
      .first()
      .should("exist");
  });

  it("13. Test user is able to COPY query into the same page from Query Pane", function() {
    cy.get(ApiEditor.backBtn).click();
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

    cy.openDropdown("QUERIES/JS");
    cy.wait(1000);

    cy.contains(".t--entity-item", "CREATE_MESSAGE_TEST").click();
    cy.get(".t--more-action-menu").should("exist");
    cy.get(".t--more-action-menu").click({ multiple: true });
    cy.selectAction("Copy to page");
    cy.selectAction("Page2");

    cy.contains(".t--entity-name", "Page2").click();
    cy.wait(1000);

    cy.openDropdown("QUERIES/JS");

    cy.contains(".t--entity-item", "CREATE_MESSAGE_TESTCopy").should("exist");
  });

  it("15. Test user is able to MOVE query into the Different page from Query Pane", function() {
    cy.contains(".t--entity-name", "Page1").click();
    cy.wait(1000);

    cy.openDropdown("QUERIES/JS");

    cy.contains(".t--entity-item", "CREATE_MESSAGE_TEST").click();
    cy.get(".t--more-action-menu").should("exist");
    cy.get(".t--more-action-menu").click({ multiple: true });
    cy.selectAction("Move to page");
    cy.selectAction("Page2");

    cy.contains(".t--entity-name", "Page2").click();
    cy.wait(1000);

    cy.openDropdown("QUERIES/JS");

    cy.contains(".t--entity-item", "CREATE_MESSAGE_TEST").should("exist");
  });

  it("16. Test user is able to Name conventions that are appropriate when moved/Copied", function() {
    cy.contains(".t--entity-name", "Page1").click();
    cy.wait(1000);

    cy.openDropdown("QUERIES/JS");

    cy.copyQuery("CREATE_MESSAGE_TESTCopy", "Page1", "Copy to page");
    cy.copyQuery("CREATE_MESSAGE_TESTCopy", "Page1", "Copy to page");
    cy.copyQuery("CREATE_MESSAGE_TESTCopy", "Page1", "Copy to page");

    cy.contains(".t--entity-item", "CREATE_MESSAGE_TESTCopyCopy2").should(
      "exist",
    );

    cy.copyQuery("CREATE_MESSAGE_TESTCopy", "Page2", "Move to page");

    cy.contains(".t--entity-name", "Page2").click();
    cy.wait(1000);

    cy.openDropdown("QUERIES/JS");

    cy.contains(".t--entity-item", "CREATE_MESSAGE_TESTCopy1").should("exist");
  });
});

Cypress.Commands.add("copyQuery", (query, page, type) => {
  cy.contains(".t--entity-item", query)
    .find(".entity-context-menu-icon")
    .click({ force: true });

  cy.selectAction(type);
  cy.selectAction(page);
});
