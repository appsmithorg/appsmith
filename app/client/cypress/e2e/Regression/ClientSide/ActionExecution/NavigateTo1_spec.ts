import { WIDGETSKIT } from "../../../../locators/WidgetLocators";
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

describe("Navigate To feature", { tags: ["@tag.JS"] }, () => {
  it("1. Navigates to page name clicked from the page name tab of navigate to", () => {
    EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.TEXT, 500, 600);
    EditorNavigation.SelectEntityByName("Text1", EntityType.Widget);
    propPane.TypeTextIntoField("Text", "{{appsmith.URL.queryParams.test}}");
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.BUTTON, 300, 300);
    EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
    propPane.SelectPlatformFunction("onClick", "Navigate to");
    dataSources.ValidateNSelectDropdown("Choose page", "Select page", "Page1");
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

    agHelper.GetNAssertElementText(
      WIDGETSKIT.textWidgetContainer,
      "123",
      "have.text",
      0,
    );

    cy.url().should("include", "a=b").and("include", "test=123");
    deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.BUTTON));
    agHelper.WaitUntilEleAppear(
      locators._widgetInDeployed(draggableWidgets.BUTTON),
    );
    agHelper.ClickButton("Submit");
    cy.url().then(($url) => {
      cy.log("deploy url is" + $url);
      expect($url).to.contain("test=123");
    });
  });
});
