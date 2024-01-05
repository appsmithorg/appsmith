import oneClickBindingLocator from "../../../../../locators/OneClickBindingLocator";
import { OneClickBinding } from "../spec_utility";
import {
  agHelper,
  entityExplorer,
  dataSources,
  draggableWidgets,
  locators,
} from "../../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";

const oneClickBinding = new OneClickBinding();

describe(
  "JSONForm widget one click binding feature",
  { tags: ["@tag.Binding"] },
  () => {
    it("1.tests select/unselect fields for json form widget", () => {
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.JSONFORM, 450, 200);

      dataSources.CreateDataSource("Postgres");

      cy.get("@dsName").then((dsName) => {
        EditorNavigation.SelectEntityByName("JSONForm1", EntityType.Widget);

        oneClickBinding.ChooseAndAssertForm(
          `${dsName}`,
          dsName,
          "public.employees",
        );
      });

      // Open the column selector modal
      agHelper.GetNClick(oneClickBindingLocator.columnSelectorModalTrigger);

      // Assert that the primary column is unchecked
      agHelper.AssertAttribute(
        oneClickBindingLocator.checkBox,
        "data-checked",
        "false",
      );

      // Deselect some columns
      const deselectColumns = ["title_of_courtesy", "birth_date", "hire_date"];

      deselectColumns.forEach((column) => {
        agHelper.GetNClick(
          oneClickBindingLocator.columnSelectorField(column),
          0,
          true,
        );
      });

      // Save the column selection
      agHelper.GetNClick(oneClickBindingLocator.columnselectorModalSaveBtn);

      agHelper.GetNClick(oneClickBindingLocator.connectData);

      agHelper.Sleep(2000);

      const selectedColumns = ["last_name", "first_name", "title"];

      // Assert that the selected columns are present in the form
      selectedColumns.forEach((column) => {
        agHelper.AssertElementExist(locators._draggableFieldConfig(column));
      });

      // Assert that the deselected columns are not present in the form
      deselectColumns.forEach((column) => {
        agHelper.AssertElementAbsence(locators._draggableFieldConfig(column));
      });
    });
  },
);
