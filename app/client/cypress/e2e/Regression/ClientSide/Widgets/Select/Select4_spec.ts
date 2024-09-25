import {
  agHelper,
  draggableWidgets,
  deployMode,
  entityExplorer,
  locators,
  propPane,
} from "../../../../../support/Objects/ObjectsCore";

// Issue link: https://github.com/appsmithorg/appsmith/issues/26696
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
      propPane.EnterJSContext(
        "onDropdownOpen",
        "{{showAlert('Dropdown opened!','success')}}",
        true,
      );
      propPane.ToggleJSMode("onDropdownOpen", false);
      propPane.EnterJSContext(
        "onOptionChange",
        "{{showAlert('Option changed!','success')}}",
        true,
      );
      propPane.ToggleJSMode("onOptionChange", false);
      deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.SELECT));
      agHelper.GetNClick(locators._widgetInDeployed(draggableWidgets.SELECT));
      agHelper.ValidateToastMessage("Dropdown opened!");
      agHelper.AssertElementVisibility(
        locators._selectOptionValue("Red"),
        true,
      );
      agHelper.GetNClick(locators._selectOptionValue("Red"));
      agHelper.ValidateToastMessage("Option changed!");
      agHelper.ValidateToastMessage("Dropdown closed!");
      cy.get("#ToastId12 > .Toastify__toast-body")
        .contains("Dropdown closed!")
        .should("have.length", 1);
    });
  },
);
