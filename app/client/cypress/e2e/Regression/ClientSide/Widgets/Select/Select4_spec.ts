import {
  agHelper, 
  draggableWidgets,
  deployMode,
  entityExplorer,
  locators,
  propPane,
} from "../../../../../support/Objects/ObjectsCore";
  
describe(
  "Select widget tests validating OnDropdownClose events are rendering show alert only once",
  { tags: ["@tag.Widget", "@tag.Select"] },
  function () {
    before(() => {
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.SELECT);
    });
  
  
    it("Validate OnDropdownClose events are rendering show alert only once", () => {
      propPane.EnterJSContext(
        "onDropdownClose",
        "{{showAlert('Dropdown closed!','success')}}",
        true,
      );
      propPane.ToggleJSMode("onDropdownClose", false);
      deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.SELECT));
      agHelper.GetNClick(locators._widgetInDeployed(draggableWidgets.SELECT));
      agHelper.AssertElementVisibility(
        locators._selectOptionValue("Red"),
        true,
      );
      agHelper.GetNClick(locators._selectOptionValue("Red"));
      agHelper.ValidateToastMessage("Dropdown closed!");
    });
  },
);
  