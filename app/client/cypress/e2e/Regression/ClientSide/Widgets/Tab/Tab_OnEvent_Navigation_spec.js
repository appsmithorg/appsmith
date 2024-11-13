import * as _ from "../../../../../support/Objects/ObjectsCore";

describe(
  "Tabs widget on change of selection navigation usecases",
  { tags: ["@tag.Widget", "@tag.Tab", "@tag.Binding"] },
  function () {
    before(() => {
      _.agHelper.AddDsl("tabsWidgetReset");
    });

    it("1.On change of tab selection Navigate to a URL", function () {
      cy.openPropertyPane("tabswidget");
      _.propPane.SelectPlatformFunction("onTabSelected", "Navigate to");
      cy.wait(1000);
      _.agHelper.GetNClick(_.propPane._navigateToType("URL"));
      _.agHelper.EnterActionValue("Enter URL", "www.appsmith.com");
      cy.wait(1000);
      //Publish the app and validate the navigation change on tab selection
      _.deployMode.DeployApp();
      cy.wait(3000);
      cy.get(".t--page-switch-tab:contains('Tab 3')").click(
        { force: true },
        { multiple: true },
      );
      cy.url().should("include", "appsmith");
      cy.go("back");
      cy.get(".t--page-switch-tab:contains('Tab 3')").should("be.visible");
    });
  },
);
