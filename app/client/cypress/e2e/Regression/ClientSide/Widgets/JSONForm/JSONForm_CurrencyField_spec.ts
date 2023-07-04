import {
  entityExplorer,
  propPane,
  agHelper,
  draggableWidgets,
  deployMode,
  table,
  locators,
} from "../../../../../support/Objects/ObjectsCore";

describe("Modal Widget background color spec", () => {
  before(() => {
    // Add a JSON form widget and change field type of one of the fields
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.JSONFORM, 300, 100);
    propPane.ChangeJsonFormFieldType("Employee Id", "Currency Input");
  });

  it("1. should check that value entered in currency field appears in the actual field", () => {
    /**
     * This case is for checking the following bug: https://github.com/appsmithorg/appsmith/issues/23671
     * This issue introduced a behaviour by which for currency field type in JSON form, users where not able to enter/type any value into it.
     **/
    agHelper
      .GetElement(locators._jsonFormInputField("employee_id"))
      .type("123");
    agHelper
      .GetText(locators._jsonFormInputField("employee_id"), "val")
      .should("be.equal", "1001123");
  });
});
