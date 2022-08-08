const testdata = require("../../../../fixtures/testdata.json");
const apiwidget = require("../../../../locators/apiWidgetslocator.json");
const pageid = "MyPage";

import { ObjectsRegistry } from "../../../../support/Objects/Registry";
let ee = ObjectsRegistry.EntityExplorer,
  agHelper = ObjectsRegistry.AggregateHelper,
  locator = ObjectsRegistry.CommonLocators,
  homePage = ObjectsRegistry.HomePage;

describe("Entity explorer API pane related testcases", function() {
  it("Empty Message validation for Widgets/API/Queries", function() {
    homePage.NavigateToHome();
    homePage.CreateNewWorkspace("EmptyMsgCheck");
    homePage.CreateAppInWorkspace("EmptyMsgCheck");
    ee.ExpandCollapseEntity("WIDGETS");
    agHelper.AssertElementVisible(
      locator._visibleTextSpan("No widget to display"),
    );
    agHelper.AssertElementVisible(locator._visibleTextDiv("NEW WIDGET"));

    ee.ExpandCollapseEntity("QUERIES/JS");
    agHelper.AssertElementVisible(
      locator._visibleTextSpan("No query/JS to display"),
    );
    agHelper.AssertElementVisible(locator._visibleTextDiv("NEW QUERY/JS"));

    ee.ExpandCollapseEntity("DATASOURCES");
    agHelper.AssertElementVisible(
      locator._visibleTextSpan("No datasource to display"),
    );
    agHelper.AssertElementVisible(locator._visibleTextDiv("NEW DATASOURCE"));
  });

  it("Move to page / edit API name /properties validation", function() {
    cy.NavigateToAPI_Panel();
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
    cy.CheckAndUnfoldEntityItem("QUERIES/JS");
    ee.ActionContextMenuByEntityName("FirstAPI", "Show Bindings");
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
    ee.ActionContextMenuByEntityName("FirstAPI", "Edit Name");
    cy.EditApiNameFromExplorer("SecondAPI");
    cy.xpath(apiwidget.popover)
      .last()
      .should("be.hidden")
      .invoke("show")
      .click({ force: true });
    ee.ActionContextMenuByEntityName("SecondAPI", "Move to page", pageid);
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
