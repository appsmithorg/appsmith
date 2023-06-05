import * as _ from "../../../../support/Objects/ObjectsCore";

describe("Navigate To feature", () => {
  it("3. Navigates to url entered from the url tab of navigate to", () => {
    _.entityExplorer.AddNewPage(); // page 2
    _.entityExplorer.SelectEntityByName("Page1");
    _.entityExplorer.DragDropWidgetNVerify(_.draggableWidgets.BUTTON, 300, 300);
    _.propPane.SelectPlatformFunction("onClick", "Navigate to");
    _.agHelper.GetNClick(_.propPane._navigateToType("URL"));
    _.agHelper.TypeText(
      _.propPane._actionSelectorFieldByLabel("Enter URL"),
      "www.google.com",
    );
    _.deployMode.DeployApp();
    _.agHelper.ClickButton("Submit");
    cy.url().should("include", "google.com");
    // go back to appsmith
    //cy.go(-1);
  });
});
