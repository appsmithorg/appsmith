const commonlocators = require("../../../../locators/commonlocators.json");
const testdata = require("../../../../fixtures/testdata.json");
const apiwidget = require("../../../../locators/apiWidgetslocator.json");
const {
  AggregateHelper,
} = require("../../../../support/Pages/AggregateHelper");

const helper = new AggregateHelper();

describe("API Panel Test Functionality ", function() {
  it("Test API copy/Move/delete feature", function() {
    cy.Createpage("SecondPage");
    cy.NavigateToAPI_Panel();
    cy.CreateAPI("FirstAPI");
    cy.enterDatasourceAndPath(testdata.baseUrl, "{{ '/random' }}");
    cy.assertPageSave();
    cy.get("body").click(0, 0);
    helper.expandCollapseEntity("QUERIES/JS");
    helper.ActionContextMenuByEntityName(
      "FirstAPI",
      "Copy to page",
      "SecondPage",
    );
    // click on learn how link
    cy.get(".t--learn-how-apis-link").click();
    // this should open in a global search modal
    cy.get(commonlocators.globalSearchModal);
    cy.get("body").click(0, 0);
    helper.ActionContextMenuByEntityName(
      "FirstAPICopy",
      "Move to page",
      "Page1",
    );
    cy.wait(2000);
    cy.get(".t--entity-name")
      .contains("FirstAPICopy")
      .click({ force: true });
    cy.get(apiwidget.resourceUrl).should("contain.text", "{{ '/random' }}");
  });
});
