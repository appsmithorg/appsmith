const pages = require("../../../../locators/Pages.json");
const queryLocators = require("../../../../locators/QueryEditor.json");
import ApiEditor from "../../../../locators/ApiEditor";

/* TO-DO
    4. Ensure the user is displayed appropriate error messages on the wrong field data
    5. Ensure Long body form is added
    6. Ensure use the method from the drop-down
    9. Ensure user is able to add special characters to the name from Pane
*/

describe("Test Query Pane  ", function() {
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
    cy.contains(".t--datasource-name", "Test Twilio")
      .find(queryLocators.createQuery)
      .click();

    cy.get(queryLocators.queryNameField).type("Test");
    cy.get(ApiEditor.twilioImage).click(); //Only to save the query name
    cy.get(ApiEditor.dropdownTypeAuth).click();
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
    cy.get(".label-icon-wrapper:contains('Twilio Account SID')").contains("*");
    cy.get(".label-icon-wrapper:contains('To')").contains("*");
    cy.get(".label-icon-wrapper:contains('From')").contains("*");
    cy.get(".label-icon-wrapper:contains('Body')").contains("*");
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
    const query1 =
      ':nth-child(2) > :nth-child(1) > [style="display: block;"] > .t--form-control-QUERY_DYNAMIC_INPUT_TEXT > [style="width: 35vw; min-height: 38px;"] > .styledComponents__DynamicAutocompleteInputWrapper-gizjok-2 > .EvaluatedValuePopup__Wrapper-dlvj8d-0 > .styledComponents__EditorWrapper-gizjok-0 > [data-testid=code-editor-target] > .CodeMirror > .CodeMirror-scroll > .CodeMirror-sizer > [style="position: relative; top: 0px;"] > .CodeMirror-lines';
    const query2 =
      ':nth-child(3) > :nth-child(1) > [style="display: block;"] > .t--form-control-QUERY_DYNAMIC_INPUT_TEXT > [style="width: 35vw; min-height: 38px;"] > .styledComponents__DynamicAutocompleteInputWrapper-gizjok-2 > .EvaluatedValuePopup__Wrapper-dlvj8d-0 > .styledComponents__EditorWrapper-gizjok-0 > [data-testid=code-editor-target] > .CodeMirror > .CodeMirror-scroll > .CodeMirror-sizer > [style="position: relative; top: 0px;"] > .CodeMirror-lines > [style="position: relative; outline: none;"] > .CodeMirror-code > .CodeMirror-line';

    cy.NavigateToApiEditor();

    cy.get("[data-cy=t--tab-ACTIVE]").click();

    cy.contains(".t--datasource-name", "Test Twilio")
      .find(queryLocators.createQuery)
      .click();

    cy.get(queryLocators.queryNameField).type("Test");
    cy.get(ApiEditor.twilioImage).click(); //Only to save the query name
    cy.get(ApiEditor.dropdownTypeAuth).click();
    cy.contains(ApiEditor.dropdownOption, "List Message").click();

    cy.get(query1).type("12345");
    cy.get(query2).type("123456789");
    cy.get(ApiEditor.backBtn).click();

    cy.contains(".t--entity-item", "Test").click();
    cy.contains(query1, "12345").should("exist");
    cy.contains(query2, "123456789").should("exist");
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
