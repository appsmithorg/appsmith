const pages = require("../../../../locators/Pages.json");
const queryLocators = require("../../../../locators/QueryEditor.json");
import ApiEditor from "../../../../locators/ApiEditor";
const dsl = require("../../../../fixtures/formInputTableDsl.json");

/* TO-DO
    8. Ensure the user is able to add special characters as names and is reflected into the
    9. Ensure the user is able to copy the binding from the entity explorer and bind to a widget
    11.Ensure the user is able to copy the binding from the entity explorer
    13.Ensure to add a longer query name and observe the behavior of the entity explorer
    14.Ensure to add a longer query name and observe if it is truncated in the entity explorer
*/

describe("Test Entity Explorer", function() {
  before(() => {
    localStorage.setItem("ApiPaneV2", "ApiPaneV2");
    cy.NavigateToApiEditor();
    cy.get(pages.integrationCreateNew)
      .should("be.visible")
      .click({ force: true });
    cy.get(".tab-title").contains("Active");
    cy.get(".tab-title:contains('Active')").click();
  });

  it("1. Test user is able to see the query in the entity explorer", function() {
    cy.contains(".t--datasource-name", "Test Twilio")
      .find(queryLocators.createQuery)
      .click();

    cy.get(queryLocators.queryNameField).type("Test");
    cy.get(ApiEditor.twilioImage).click(); //Only to save the query name

    cy.openDropdown("QUERIES/JS");
    cy.wait(1000);

    cy.contains(".t--entity-item", "Test").should("exist");
  });

  it("2. Test the user is able to change the name from the Entity explorer", function() {
    cy.contains(".t--entity-item", "Test")
      .find(".entity-context-menu-icon")
      .click({ force: true });

    cy.selectAction("Edit Name");

    cy.contains(".t--entity-item", "Test").type("CREATE_MESSAGE_TEST");

    cy.get(ApiEditor.twilioImage).click(); //Only to save the query name

    cy.contains(".t--entity-item", "CREATE_MESSAGE_TEST").should("exist");
  });

  it("3. Test the user is able to COPY query into the same page from entity explorer", function() {
    cy.copyQuery("CREATE_MESSAGE_TEST", "Page1", "Copy to page");

    cy.contains(".t--entity-item", "CREATE_MESSAGE_TESTCopy").should("exist");
  });

  it("4. Test the user is able to COPY query into the Different page from entity explorer", function() {
    cy.Createpage("Page2");
    cy.contains(".t--entity-name", "Page1").click();

    cy.openDropdown("QUERIES/JS");
    cy.wait(1000);

    cy.copyQuery("CREATE_MESSAGE_TEST", "Page2", "Copy to page");

    cy.contains(".t--entity-name", "Page2").click();
    cy.wait(1000);

    cy.openDropdown("QUERIES/JS");
    cy.contains(".t--entity-item", "CREATE_MESSAGE_TEST").should("exist");
  });

  it("5. Test the user is able to MOVE query into the Different page from entity explorer", function() {
    cy.contains(".t--entity-name", "Page1").click();
    cy.wait(1000);

    cy.openDropdown("QUERIES/JS");

    cy.copyQuery("CREATE_MESSAGE_TESTCopy", "Page2", "Move to page");

    cy.contains(".t--entity-name", "Page2").click();
    cy.wait(1000);

    cy.openDropdown("QUERIES/JS");

    cy.contains(".t--entity-item", "CREATE_MESSAGE_TESTCopy").should("exist");
  });

  it("6. Test the user is able to Name conventions that are appropriate when moved/Copied.", function() {
    cy.contains(".t--entity-name", "Page1").click();
    cy.wait(1000);

    cy.openDropdown("QUERIES/JS");

    cy.copyQuery("CREATE_MESSAGE_TEST", "Page1", "Copy to page");
    cy.copyQuery("CREATE_MESSAGE_TEST", "Page1", "Copy to page");
    cy.copyQuery("CREATE_MESSAGE_TEST", "Page1", "Copy to page");
    cy.copyQuery("CREATE_MESSAGE_TESTCopy", "Page1", "Copy to page");

    cy.contains(".t--entity-item", "CREATE_MESSAGE_TESTCopy1").should("exist");
    cy.contains(".t--entity-item", "CREATE_MESSAGE_TESTCopy2").should("exist");
    cy.contains(".t--entity-item", "CREATE_MESSAGE_TESTCopyCopy").should(
      "exist",
    );

    cy.copyQuery("CREATE_MESSAGE_TEST", "Page2", "Move to page");

    cy.contains(".t--entity-name", "Page2").click();
    cy.wait(1000);

    cy.openDropdown("QUERIES/JS");

    cy.contains(".t--entity-item", "CREATE_MESSAGE_TEST1").should("exist");
  });

  it("7. Test the user is able to delete the query from the Entity explorer", function() {
    cy.contains(".t--entity-name", "Page2").click();
    cy.wait(1000);

    cy.openDropdown("QUERIES/JS");

    cy.contains(".t--entity-item", "CREATE_MESSAGE_TESTCopy")
      .find(".entity-context-menu-icon")
      .click({ force: true });

    cy.selectAction("Delete");
    cy.selectAction("Are you sure?");

    cy.openDropdown("QUERIES/JS");

    cy.get(".t--entity-item:contains('CREATE_MESSAGE_TEST')").should(
      "not.exist",
    );
  });

  /*it("9.Test the user is able to copy the binding from the entity explorer and bind to a widget", function() {
    cy.addDsl(dsl);

    cy.SearchEntityandOpen("Input1");
    cy.testJsontext("defaulttext", "Copy data");

    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
  });*/

  it("10. Test the user is able to click Show BIndings and added binding are displayed to the user", function() {
    cy.contains(".t--entity-name", "Page1").click();

    cy.contains(".t--entity-item", "CREATE_MESSAGE_TESTCopy")
      .find(".entity-context-menu-icon")
      .click({ force: true });

    cy.selectAction("Show Bindings");

    cy.contains(".sticky", "BINDINGS").should("exist");
    cy.contains(
      ".language-appsmith-binding",
      "{{CREATE_MESSAGE_TESTCopy.isLoading}}",
    ).should("exist");
  });

  it("11.Test the user is able to copy the binding from the entity explorer", function() {
    cy.contains(
      ".language-appsmith-binding",
      "{{CREATE_MESSAGE_TESTCopy.isLoading}}",
    ).click();
  });

  it("12.Test the user is able to close the binding option by clicking on the cross mark", function() {
    cy.get(".t--entity-property-close").should("exist");
    cy.get(".t--entity-property-close").click();
  });

  it("13.Test add a longer query name and observe the behavior of the entity explorer", function() {
    cy.contains(".t--entity-item", "CREATE_MESSAGE_TESTCopy1")
      .find(".entity-context-menu-icon")
      .click({ force: true });

    cy.selectAction("Edit Name");

    cy.contains(".t--entity-item", "CREATE_MESSAGE_TESTCopy1").type(
      "CREATE MESSAGE TEST LONG NAME MORE MORE MORE LONGER",
    );

    cy.get("[alt='entityIcon']").click({ multiple: true }); //Only to save the query name

    cy.wait(3000);

    cy.contains(
      ".t--entity-item",
      "CREATE_MESSAGE_TEST_LONG_NAME_MORE_MORE_MORE_LONGER",
    ).should("not.exist");
  });

  it("14.Test add a longer query name and observe if it is truncated in the entity explorer", function() {
    cy.contains(
      ".t--entity-item",
      "CREATE_MESSAGE_TEST_LONG_NAME_MORE_MORE_MORE_LONGER",
    ).should("not.exist");
    cy.contains(".t--entity-item", "CREATE_MESSAGE_TEST_LONG_NAME_").should(
      "exist",
    );
  });
});

Cypress.Commands.add("copyQuery", (query, page, type) => {
  cy.contains(".t--entity-item", query)
    .find(".entity-context-menu-icon")
    .click({ force: true });

  cy.selectAction(type);
  cy.selectAction(page);

  cy.wait(1000);
});
