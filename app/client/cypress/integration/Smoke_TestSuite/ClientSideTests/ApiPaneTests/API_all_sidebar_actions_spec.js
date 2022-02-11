const commonlocators = require("../../../../locators/commonlocators.json");
const testdata = require("../../../../fixtures/testdata.json");
const apiwidget = require("../../../../locators/apiWidgetslocator.json");

describe("API Panel Test Functionality ", function() {
  it("Test API copy/Move/delete feature", function() {
    cy.log("Login Successful");
    cy.Createpage("SecondPage");
    cy.NavigateToAPI_Panel();
    cy.log("Navigation to API Panel screen successful");
    cy.CreateAPI("FirstAPI");
    cy.enterDatasourceAndPath(testdata.baseUrl, "{{ '/random' }}");
    cy.log("Creation of FirstAPI Action successful");
    //cy.GlobalSearchEntity("FirstAPI");
    cy.xpath('//*[local-name()="g" and @id="Icon/Outline/more-vertical"]')
      .last()
      .should("be.hidden")
      .invoke("show")
      .click({ force: true });
    cy.copyEntityToPage("SecondPage");
    // click on learn how link
    cy.get(".t--learn-how-apis-link").click();
    // this should open in a global search modal
    cy.get(commonlocators.globalSearchModal);
    cy.get("body").click(0, 0);
    cy.MoveAPIToPage("Page1");
    cy.get(".t--entity-name")
      .contains("FirstAPICopy")
      .click({ force: true });
    cy.get(apiwidget.resourceUrl).should("contain.text", "{{ '/random' }}");
    cy.DeleteAPIFromSideBar();
  });
});
