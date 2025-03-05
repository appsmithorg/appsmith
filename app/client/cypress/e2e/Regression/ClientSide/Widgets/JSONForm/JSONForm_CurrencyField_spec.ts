import {
  entityExplorer,
  propPane,
  agHelper,
  draggableWidgets,
  deployMode,
  table,
  locators,
} from "../../../../../support/Objects/ObjectsCore";

describe(
  "Modal Widget background color spec",
  { tags: ["@tag.Widget", "@tag.JSONForm", "@tag.Binding"] },
  () => {
    const schema = {
      name: "John",
      date_of_birth: "20/02/1990",
      employee_id: 1001,
    };

    before(() => {
      // Add a JSON form widget and change field type of one of the fields
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.JSONFORM, 300, 100);
      propPane.EnterJSContext(
        "sourcedata",
        JSON.stringify(schema, null, 2),
        true,
        false,
      );
      propPane.ChangeJsonFormFieldType("Employee Id", "Currency Input");
      propPane.NavigateBackToPropertyPane();
    });

    it("1. should check that value entered in currency field appears in the actual field", () => {
      /**
       * This case is for checking the following bug: https://github.com/appsmithorg/appsmith/issues/23671
       * This issue introduced a behaviour by which for currency field type in JSON form, users where not able to enter/type any value into it.
       **/

      propPane.SelectPlatformFunction("onSubmit", "Show alert");
      agHelper.TypeText(
        propPane._actionSelectorFieldByLabel("Message"),
        "{{JSONForm1.formData.employee_id.toString()}}",
      );
      deployMode.DeployApp();

      agHelper.TypeText(
        locators._jsonFormInputField("employee_id"),
        "123 konnichiwa",
      );
      agHelper.Sleep(500);
      agHelper.ClickButton("Submit");
      agHelper.ValidateToastMessage("1001123");
      agHelper
        .GetText(locators._jsonFormInputField("employee_id"), "val")
        .should("be.equal", "1001123");
    });
  },
);
