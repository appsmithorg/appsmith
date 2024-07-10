import {
  agHelper,
  deployMode,
  draggableWidgets,
  entityExplorer,
  locators,
  propPane,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

describe(
  "Bug 34823 : Changing modal name does not change its references inside modal's widgets",
  { tags: ["@tag.Widget", "@tag.Modal"] },
  function () {
    it("1. Modal widget should change all references inside it on rename", () => {
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.BUTTON);
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.MODAL, 300, 300);
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.EnterJSContext("onClick", "{{showModal(Modal1.name);}}");

      propPane.RenameWidget("Modal1", "ModalNew");

      deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.BUTTON));
      agHelper.WaitUntilEleAppear(
        locators._widgetInDeployed(draggableWidgets.BUTTON),
      ); //Wait for widgets to settle

      //Verify that the Modal widget opens correctly when configured on a button click.
      agHelper.ClickButton("Submit");
      agHelper.WaitUntilEleAppear(locators._modal);
      agHelper.AssertElementExist(locators._modal);

      //Verify that the Modal widget is closed and no longer visible on the screen on clicking the "X" button.
      agHelper.AssertElementVisibility(
        locators._widgetInDeployed(draggableWidgets.ICONBUTTON),
      );
      agHelper.GetNClick(
        locators._widgetInDeployed(draggableWidgets.ICONBUTTON),
      );
      agHelper.WaitUntilEleDisappear(locators._modal);
      agHelper.AssertElementAbsence(locators._modal);

      agHelper.ClickButton("Submit");
      agHelper.WaitUntilEleAppear(locators._modal);
      agHelper.AssertElementExist(locators._modal);

      agHelper.AssertElementVisibility(
        locators._widgetInDeployed(draggableWidgets.ICONBUTTON),
      );
      agHelper.ClickButton("Close");
      agHelper.WaitUntilEleDisappear(locators._modal);
      agHelper.AssertElementAbsence(locators._modal);
    });
  },
);
