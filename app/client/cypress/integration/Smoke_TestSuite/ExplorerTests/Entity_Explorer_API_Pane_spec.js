const testdata = require("../../../fixtures/testdata.json");
const apiwidget = require("../../../locators/apiWidgetslocator.json");
const explorer = require("../../../locators/explorerlocators.json");
const pageid = "MyPage";

describe("Entity explorer API pane related testcases", function() {
  it("Empty Message validation for Widgets/API/Queries", function() {
    cy.log("Login Successful");
    cy.NavigateToWidgetsInExplorer();
    cy.get(explorer.NoWidgetsMsg).should("be.visible");
    cy.NavigateToAPI_Panel();
    cy.get(explorer.NoApiMsg)
      .should("be.visible")
      .should("be.visible");
    cy.NavigateToQueriesInExplorer();
    cy.get(explorer.NoQueryMsg)
      .should("be.visible")
      .should("be.visible");
    cy.reload();
  });

  it("Move to page / edit API name /properties validation", function() {
    cy.log("Login Successful");
    cy.NavigateToAPI_Panel();
    cy.log("Navigation to API Panel screen successful");
    cy.CreateAPI("FirstAPI");
    cy.log("Creation of FirstAPI Action successful");
    cy.enterDatasourceAndPath(testdata.baseUrl, testdata.methods);
    cy.SaveAndRunAPI();
    cy.validateRequest(testdata.baseUrl, testdata.methods, testdata.Get);
    cy.ResponseStatusCheck(testdata.successStatusCode);
    cy.get(apiwidget.propertyList).then(function($lis) {
      expect($lis).to.have.length(3);
      expect($lis.eq(0)).to.contain("{{FirstAPI.isLoading}}");
      expect($lis.eq(1)).to.contain("{{FirstAPI.data}}");
      expect($lis.eq(2)).to.contain("{{FirstAPI.run()}}");
    });
    cy.Createpage(pageid);
    cy.GlobalSearchEntity("FirstAPI");
    cy.EditApiNameFromExplorer("SecondAPI");
    cy.GlobalSearchEntity("SecondAPI");
    cy.xpath(apiwidget.popover)
      .last()
      .should("be.hidden")
      .invoke("show")
      .click({ force: true });
    cy.MoveAPIToPage(pageid);
    cy.SearchEntityandOpen("SecondAPI");
    /*To be enabled once the bug is fixed
    cy.get(apiwidget.propertyList).then(function($lis) {
      expect($lis).to.have.length(3);
      expect($lis.eq(0)).to.contain('{{SecondAPI.isLoading}}');
      expect($lis.eq(1)).to.contain('{{SecondAPI.data}}');
      expect($lis.eq(2)).to.contain('{{SecondAPI.run()}}');
    });*/
  });
});
