import {
  agHelper,
  entityExplorer,
  propPane,
  deployMode,
  draggableWidgets,
} from "../../../../support/Objects/ObjectsCore";

describe("Navigate To feature", () => {
  it("2. Gives error message when invalid word is entered in the url tab of navigate to", () => {
    entityExplorer.AddNewPage(); // page 2
    entityExplorer.SelectEntityByName("Page1");
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.BUTTON, 300, 300);
    entityExplorer.SelectEntityByName("Button1", "Widgets");
    propPane.SelectPlatformFunction("onClick", "Navigate to");
    agHelper.GetNClick(propPane._navigateToType("URL"));
    agHelper.TypeText(
      propPane._actionSelectorFieldByLabel("Enter URL"),
      "wrongPage",
    );
    deployMode.DeployApp();
    agHelper.ClickButton("Submit");
    agHelper.ValidateToastMessage("Enter a valid URL or page name");
    deployMode.NavigateBacktoEditor();
  });
});
