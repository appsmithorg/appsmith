const testdata = require("../../../fixtures/testdata.json");
const apiwidget = require("../../../locators/apiWidgetslocator.json");

describe("API Panel Test Functionality", function() {
  it("Test Search API fetaure", function() {
    cy.log("Login Successful");
    cy.NavigateToAPI_Panel();
    cy.log("Navigation to API Panel screen successful");
    cy.CreateAPI("FirstAPI");
    cy.get("textarea").should(
      "have.attr",
      "placeholder",
      "https://mock-api.appsmith.com/users",
    );
    cy.log("Creation of FirstAPI Action successful");
    cy.enterDatasourceAndPath(testdata.baseUrl, testdata.methods);
    cy.SaveAndRunAPI();
    cy.validateRequest(testdata.baseUrl, testdata.methods, testdata.Get);
    cy.ResponseStatusCheck(testdata.successStatusCode);
    cy.SearchEntityandOpen("FirstAPI");
    cy.EditApiName("SecondAPI");
    cy.ClearSearch();
    cy.SearchEntityandOpen("SecondAPI");
    cy.DeleteAPI();
    cy.ClearSearch();
  });

  it("Should not crash on key delete", function() {
    cy.NavigateToAPI_Panel();
    cy.CreateAPI("CrashTestAPI");
    cy.SelectAction(testdata.postAction);
    // Todo: find a way to clear without doing it character by character
    cy.xpath(apiwidget.postDefaultContentTypeHeaderKey)
      .first()
      .click({ force: true })
      .clear({ force: true }) // c
      .clear({ force: true }) // o
      .clear({ force: true }) // n
      .clear({ force: true }) // t
      .clear({ force: true }) // e
      .clear({ force: true }) // n
      .clear({ force: true }) // t
      .clear({ force: true }) // -
      .clear({ force: true }) // t
      .clear({ force: true }) // y
      .clear({ force: true }) // p
      .clear({ force: true }); // e
    // assert so that this fails
    cy.xpath(apiwidget.postDefaultContentTypeHeaderKey).should("be.visible");
    cy.xpath(apiwidget.postDefaultContentTypeHeaderKey).should(
      "have.value",
      "",
    );
  });
});
