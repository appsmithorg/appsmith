import * as _ from "../../../../support/Objects/ObjectsCore";

describe("Navigate To feature", () => {
  it("1. Navigates to page name clicked from the page name tab of navigate to", () => {
    _.entityExplorer.AddNewPage(); // page 2
    _.entityExplorer.SelectEntityByName("Page1");
    _.entityExplorer.DragDropWidgetNVerify(_.draggableWidgets.BUTTON, 300, 300);
    _.entityExplorer.SelectEntityByName("Button1", "Widgets");
    _.propPane.SelectPlatformFunction("onClick", "Navigate to");
    _.dataSources.ValidateNSelectDropdown(
      "Choose Page",
      "Select Page",
      "Page2",
    );
    _.propPane.UpdatePropertyFieldValue(
      "Query Params",
      `{{
      {
       test: '123'
      }
      }}`,
    );
    _.agHelper.AssertAutoSave();
    _.agHelper.PopupClose("onClick");
    _.agHelper.ClickButton("Submit");
    cy.url().should("include", "a=b").and("include", "test=123");
    _.entityExplorer.SelectEntityByName("Page1");
    _.deployMode.DeployApp();
    _.agHelper.ClickButton("Submit");
    _.agHelper.GetNAssertContains(
      _.locators._emptyPageTxt,
      "This page seems to be blank",
    );
    cy.url().then(($url) => {
      cy.log("deploy url is" + $url);
      expect($url).to.contain("test=123");
    });
    //cy.location().its('href').should('include', 'test=123')//both are same
    _.deployMode.NavigateBacktoEditor();
  });

  it("2. Gives error message when invalid word is entered in the url tab of navigate to", () => {
    _.entityExplorer.SelectEntityByName("Page1");
    _.propPane.DeleteWidgetFromPropertyPane("Button1");
    _.entityExplorer.DragDropWidgetNVerify(_.draggableWidgets.BUTTON, 200, 300);
    _.propPane.SelectPlatformFunction("onClick", "Navigate to");
    _.agHelper.GetNClick(_.propPane._navigateToType("URL"));
    _.agHelper.TypeText(
      _.propPane._actionSelectorFieldByLabel("Enter URL"),
      "wrongPage",
    );
    _.deployMode.DeployApp();
    _.agHelper.ClickButton("Submit");
    _.agHelper.ValidateToastMessage("Enter a valid URL or page name");
    _.deployMode.NavigateBacktoEditor();
  });

  it("3. Navigates to url entered from the url tab of navigate to", () => {
    _.entityExplorer.SelectEntityByName("Button1", "Widgets");
    _.propPane.DeleteWidgetFromPropertyPane("Button1");
    _.entityExplorer.DragDropWidgetNVerify(_.draggableWidgets.BUTTON, 200, 100);
    _.propPane.SelectPlatformFunction("onClick", "Navigate to");
    _.agHelper.GetNClick(_.propPane._navigateToType("URL"));
    _.agHelper.TypeText(
      _.propPane._actionSelectorFieldByLabel("Enter URL"),
      "google.com",
    );
    _.deployMode.DeployApp();
    _.agHelper.ClickButton("Submit");
    cy.url().should("include", "google.com");
    // go back to appsmith
    //cy.go(-1);
  });
});
