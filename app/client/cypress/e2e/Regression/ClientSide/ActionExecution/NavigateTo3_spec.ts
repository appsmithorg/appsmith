import {
  agHelper,
  entityExplorer,
  propPane,
  deployMode,
  draggableWidgets,
} from "../../../../support/Objects/ObjectsCore";

describe("Navigate To feature", () => {
  it("3. Navigates to url entered from the url tab of navigate to", () => {
    entityExplorer.AddNewPage(); // page 2
    entityExplorer.SelectEntityByName("Page1");
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
