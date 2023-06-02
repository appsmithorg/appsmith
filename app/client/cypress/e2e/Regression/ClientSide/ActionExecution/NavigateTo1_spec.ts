import * as _ from "../../../../support/Objects/ObjectsCore";

describe("Navigate To feature", () => {
  it("1. Navigates to page name clicked from the page name tab of navigate to", () => {
    _.entityExplorer.AddNewPage(); // page 2
    _.entityExplorer.SelectEntityByName("Page1");
    _.entityExplorer.DragDropWidgetNVerify(_.draggableWidgets.BUTTON, 300, 300);
    _.entityExplorer.SelectEntityByName("Button1", "Widgets");
    _.propPane.SelectPlatformFunction("onClick", "Navigate to");
    _.dataSources.ValidateNSelectDropdown(
      "Choose page",
      "Select page",
      "Page2",
    );
    _.propPane.UpdatePropertyFieldValue(
      "Query params",
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
  });
});
