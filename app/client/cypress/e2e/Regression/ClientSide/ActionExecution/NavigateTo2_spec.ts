import * as _ from "../../../../support/Objects/ObjectsCore";

describe("Navigate To feature", () => {
  it("2. Gives error message when invalid word is entered in the url tab of navigate to", () => {
    _.entityExplorer.AddNewPage(); // page 2
    _.entityExplorer.SelectEntityByName("Page1");
    _.entityExplorer.DragDropWidgetNVerify(_.draggableWidgets.BUTTON, 300, 300);
    _.entityExplorer.SelectEntityByName("Button1", "Widgets");
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
});
