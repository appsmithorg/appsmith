import {
  agHelper,
  deployMode,
  draggableWidgets,
  entityExplorer,
  propPane,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";
import PageList from "../../../../support/Pages/PageList";

describe("Navigate To feature", () => {
  it("3. Navigates to url entered from the url tab of navigate to", () => {
    PageList.AddNewPage(); // page 2
    EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.BUTTON, 300, 300);
    propPane.SelectPlatformFunction("onClick", "Navigate to");
    agHelper.GetNClick(propPane._navigateToType("URL"));
    agHelper.TypeText(
      propPane._actionSelectorFieldByLabel("Enter URL"),
      "www.google.com",
    );
    deployMode.DeployApp();
    agHelper.ClickButton("Submit");
    cy.url().should("include", "google.com");
    // go back to appsmith
    //cy.go(-1);
  });
});
