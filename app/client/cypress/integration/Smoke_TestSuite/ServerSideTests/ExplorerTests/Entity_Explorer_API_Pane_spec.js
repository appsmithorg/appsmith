const testdata = require("../../../../fixtures/testdata.json");
const apiwidget = require("../../../../locators/apiWidgetslocator.json");
const explorer = require("../../../../locators/explorerlocators.json");
const pageid = "MyPage";

import { AggregateHelper } from "../../../../support/Pages/AggregateHelper";

const AHelper = new AggregateHelper();

describe("Entity explorer API pane related testcases", function() {
  it("Empty Message validation for Widgets/API/Queries", function() {
    cy.log("Login Successful");
    cy.NavigateToWidgetsInExplorer();
    cy.get(explorer.NoWidgetsMsg).should("be.visible");
    cy.NavigateToAPI_Panel();
    cy.NavigateToQueriesInExplorer();
    cy.reload();
  });

  it.only("Move to page / edit API name /properties validation", function() {
    cy.log("Login Successful");
    cy.NavigateToAPI_Panel();
    cy.log("Navigation to API Panel screen successful");
    cy.CreateAPI("FirstAPI");
    cy.log("Creation of FirstAPI Action successful");
    cy.enterDatasourceAndPath(testdata.baseUrl, testdata.methods);
    cy.SaveAndRunAPI();
    cy.validateRequest(
      "FirstAPI",
      testdata.baseUrl,
      testdata.methods,
      testdata.Get,
    );
    cy.ResponseStatusCheck(testdata.successStatusCode);
    AHelper.ActionContextMenuByEntityName("FirstAPI", "Show Bindings");
    cy.get(apiwidget.propertyList).then(function($lis) {
      expect($lis).to.have.length(5);
      expect($lis.eq(0)).to.contain("{{FirstAPI.isLoading}}");
      expect($lis.eq(1)).to.contain("{{FirstAPI.data}}");
      expect($lis.eq(2)).to.contain("{{FirstAPI.responseMeta}}");
      expect($lis.eq(3)).to.contain("{{FirstAPI.run()}}");
      expect($lis.eq(4)).to.contain("{{FirstAPI.clear()}}");
    });
    cy.get(apiwidget.actionlist)
      .contains(testdata.Get)
      .should("be.visible");
    cy.Createpage(pageid);
    cy.get(".t--entity-name")
      .contains("Page1")
      .click();
    AHelper.ActionContextMenuByEntityName("FirstAPI", "Edit Name");
    cy.EditApiNameFromExplorer("SecondAPI");
    cy.xpath(apiwidget.popover)
      .last()
      .should("be.hidden")
      .invoke("show")
      .click({ force: true });
    AHelper.ActionContextMenuByEntityName("SecondAPI", "Move to page", pageid);
    cy.get(".t--entity-name")
      .contains("SecondAPI")
      .should("exist");
    /*To be enabled once the bug is fixed
    cy.get(apiwidget.propertyList).then(function($lis) {
      expect($lis).to.have.length(3);
      expect($lis.eq(0)).to.contain('{{SecondAPI.isLoading}}');
      expect($lis.eq(1)).to.contain('{{SecondAPI.data}}');
      expect($lis.eq(2)).to.contain('{{SecondAPI.run()}}');
    });*/
  });
});
