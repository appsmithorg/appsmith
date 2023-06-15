const testdata = require("../../../../fixtures/testdata.json");
const apiwidget = require("../../../../locators/apiWidgetslocator.json");
const pageid = "MyPage";

import { ObjectsRegistry } from "../../../../support/Objects/Registry";

let ee = ObjectsRegistry.EntityExplorer,
  agHelper = ObjectsRegistry.AggregateHelper,
  locator = ObjectsRegistry.CommonLocators,
  homePage = ObjectsRegistry.HomePage;

describe("Entity explorer API pane related testcases", function () {
  it("1. Empty Message validation for Widgets/API/Queries", function () {
    homePage.NavigateToHome();
    homePage.CreateNewWorkspace("EmptyMsgCheck");
    homePage.CreateAppInWorkspace("EmptyMsgCheck");
    ee.ExpandCollapseEntity("Widgets");
    agHelper.AssertElementVisible(
      locator._visibleTextSpan("No widget to display"),
    );
    agHelper.AssertElementVisible(locator._visibleTextSpan("New widget"));

    ee.ExpandCollapseEntity("Queries/JS");
    agHelper.AssertElementVisible(
      locator._visibleTextSpan("No query/JS to display"),
    );
    agHelper.AssertElementVisible(locator._visibleTextSpan("New query/JS"));

    ee.ExpandCollapseEntity("Datasources");
    agHelper.AssertElementVisible(
      locator._visibleTextSpan("No datasource to display"),
    );
    agHelper.AssertElementVisible(locator._visibleTextSpan("New datasource"));
  });

  it("2. Move to page / edit API name /properties validation", function () {
    cy.NavigateToAPI_Panel();
    cy.CreateAPI("FirstAPI");
    cy.enterDatasourceAndPath(testdata.baseUrl, testdata.methods);
    cy.SaveAndRunAPI();
    cy.validateRequest(
      "FirstAPI",
      testdata.baseUrl,
      testdata.methods,
      testdata.Get,
    );
    cy.ResponseStatusCheck(testdata.successStatusCode);
    ee.ExpandCollapseEntity("Queries/JS");
    ee.ActionContextMenuByEntityName({
      entityNameinLeftSidebar: "FirstAPI",
      action: "Show bindings",
    });
    cy.get(apiwidget.propertyList).then(function ($lis) {
      expect($lis).to.have.length(5);
      expect($lis.eq(0)).to.contain("{{FirstAPI.isLoading}}");
      expect($lis.eq(1)).to.contain("{{FirstAPI.data}}");
      expect($lis.eq(2)).to.contain("{{FirstAPI.responseMeta}}");
      expect($lis.eq(3)).to.contain("{{FirstAPI.run()}}");
      expect($lis.eq(4)).to.contain("{{FirstAPI.clear()}}");
    });
    cy.get(apiwidget.actionlist).contains(testdata.Get).should("be.visible");
    cy.Createpage(pageid);
    ee.SelectEntityByName("Page1");
    agHelper.Sleep(); //for the selected entity to settle loading!
    ee.ExpandCollapseEntity("Queries/JS");
    ee.ActionContextMenuByEntityName({
      entityNameinLeftSidebar: "FirstAPI",
      action: "Edit name",
    });
    cy.EditApiNameFromExplorer("SecondAPI");
    cy.xpath(apiwidget.popover)
      .last()
      .should("be.hidden")
      .invoke("show")
      .click({ force: true });
    ee.ActionContextMenuByEntityName({
      entityNameinLeftSidebar: "SecondAPI",
      action: "Move to page",
      subAction: pageid,
      toastToValidate: "action moved to page",
    });
    cy.wait(500);
    ee.ExpandCollapseEntity("Queries/JS");
    ee.AssertEntityPresenceInExplorer("SecondAPI");
    ee.ActionContextMenuByEntityName({
      entityNameinLeftSidebar: "SecondAPI",
      action: "Show bindings",
    });
    cy.get(apiwidget.propertyList).then(function ($lis) {
      expect($lis).to.have.length(5);
      expect($lis.eq(0)).to.contain("{{SecondAPI.isLoading}}");
      expect($lis.eq(1)).to.contain("{{SecondAPI.data}}");
      expect($lis.eq(2)).to.contain("{{SecondAPI.responseMeta}}");
      expect($lis.eq(3)).to.contain("{{SecondAPI.run()}}");
      expect($lis.eq(4)).to.contain("{{SecondAPI.clear()}}");
    });
  });
});
