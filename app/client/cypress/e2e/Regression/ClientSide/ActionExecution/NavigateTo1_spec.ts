import {
  agHelper,
  dataSources,
  deployMode,
  draggableWidgets,
  entityExplorer,
  locators,
  propPane,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";
import PageList from "../../../../support/Pages/PageList";

describe("Navigate To feature", () => {
  it("1. Navigates to page name clicked from the page name tab of navigate to", () => {
    PageList.AddNewPage(); // page 2
    EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.BUTTON, 300, 300);
    EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
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
    agHelper.GetNClick(propPane._actionSelectorPopupClose);
    agHelper.ClickButton("Submit");
    cy.url().should("include", "a=b").and("include", "test=123");
    EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
    deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.BUTTON));
    agHelper.Sleep();
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
