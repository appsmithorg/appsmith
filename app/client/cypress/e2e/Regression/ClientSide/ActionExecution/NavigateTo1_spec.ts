import {
  agHelper,
  locators,
  entityExplorer,
  propPane,
  deployMode,
  dataSources,
  draggableWidgets,
} from "../../../../support/Objects/ObjectsCore";

describe("Navigate To feature", () => {
  it("1. Navigates to page name clicked from the page name tab of navigate to", () => {
    entityExplorer.AddNewPage(); // page 2
    entityExplorer.SelectEntityByName("Page1");
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.BUTTON, 300, 300);
    entityExplorer.SelectEntityByName("Button1", "Widgets");
    propPane.SelectPlatformFunction("onClick", "Navigate to");
    dataSources.ValidateNSelectDropdown("Choose page", "Select page", "Page2");
    propPane.UpdatePropertyFieldValue(
      "Query params",
      `{{
      {
       test: '123'
      }
      }}`,
    );
    agHelper.AssertAutoSave();
    agHelper.PopupClose("onClick");
    agHelper.ClickButton("Submit");
    cy.url().should("include", "a=b").and("include", "test=123");
    entityExplorer.SelectEntityByName("Page1");
    deployMode.DeployApp();
    agHelper.ClickButton("Submit");
    agHelper.GetNAssertContains(
      locators._emptyPageTxt,
      "This page seems to be blank",
    );
    cy.url().then(($url) => {
      cy.log("deploy url is" + $url);
      expect($url).to.contain("test=123");
    });
    //cy.location().its('href').should('include', 'test=123')//both are same
  });
});
