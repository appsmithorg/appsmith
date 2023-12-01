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
  it("2. Gives error message when invalid word is entered in the url tab of navigate to", () => {
    PageList.AddNewPage(); // page 2
    EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.BUTTON, 300, 300);
    EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
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
