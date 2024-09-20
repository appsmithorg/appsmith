import oneClickBindingLocator from "../../../../../locators/OneClickBindingLocator";
import { OneClickBinding } from "../spec_utility";
import {
  agHelper,
  entityExplorer,
  dataSources,
  table,
  draggableWidgets,
  assertHelper,
} from "../../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";

const oneClickBinding = new OneClickBinding();

describe(
  "Table widget one click binding feature",
  { tags: ["@tag.Binding", "@tag.Sanity"] },
  () => {
    it("should check that queries are created and bound to table widget properly", () => {
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.TABLE, 450, 200);

      dataSources.CreateDataSource("Postgres");

      cy.get("@dsName").then((dsName) => {
        EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);

        oneClickBinding.ChooseAndAssertForm(
          `${dsName}`,
          dsName,
          "public.employees",
          {
            searchableColumn: "first_name",
          },
        );
      });

      agHelper.GetNClick(oneClickBindingLocator.connectData);

      // Validates the value of source for action creation -
      // should be one click binding here
      cy.wait("@createNewApi").then((interception) => {
        expect(interception.request.body.source).to.equal("ONE_CLICK_BINDING");
      });

      assertHelper.AssertNetworkStatus("@postExecute");

      agHelper.Sleep(2000);

      [
        "employee_id",
        "last_name",
        "first_name",
        "title",
        "title_of_courtesy",
        "birth_date",
        "hire_date",
      ].forEach((column) => {
        agHelper.AssertElementExist(table._headerCell(column));
      });

      agHelper.AssertElementExist(table._showPageItemsCount);

      table.AddNewRow();

      //const randomNumber = Cypress._.random(10, 100, false);
      //cy.log("randomeNumber: " + randomNumber);

      // table.EditTableCell(0, 0, randomNumber.toString(), false);//Bug 24623 - since 2 digit id is not typed properly
      table.UpdateTableCell(0, 1, "_");
      table.UpdateTableCell(0, 2, "appsmith_");

      agHelper.GetNClick(oneClickBindingLocator.dateInput, 0, true);
      agHelper.GetNClick(oneClickBindingLocator.dayViewFromDate, 0, true);

      agHelper.GetNClick(oneClickBindingLocator.dateInput, 1, true);
      agHelper.GetNClick(oneClickBindingLocator.dayViewFromDate, 0, true);

      table.UpdateTableCell(0, 16, "1");

      agHelper.Sleep(2000);

      agHelper.GetNClick(table._saveNewRow, 0, true);

      assertHelper.AssertNetworkStatus("@postExecute");

      agHelper.TypeText(table._searchInput, "appsmith_");

      assertHelper.AssertNetworkStatus("@postExecute");

      agHelper.AssertElementExist(table._bodyCell("appsmith_"));

      agHelper.Sleep();

      //(cy as any).editTableCell(1, 0);

      agHelper.Sleep(500);

      table.EditTableCell(0, 2, "cypress");

      //(cy as any).enterTableCellValue(1, 0, "automation@appsmith{enter}");

      agHelper.Sleep();

      (cy as any).AssertTableRowSavable(18, 0);

      (cy as any).saveTableRow(18, 0);

      assertHelper.AssertNetworkStatus("@postExecute");

      assertHelper.AssertNetworkStatus("@postExecute");

      agHelper.Sleep(500);
      agHelper.ClearNType(table._searchInput, "cypress");

      assertHelper.AssertNetworkStatus("@postExecute");

      agHelper.Sleep(2000);

      agHelper.AssertElementExist(table._bodyCell("cypress"));

      //TODO: Commenting out until cypress double click issue is resolved.
      // agHelper.ClearTextField(table._searchInput);

      // agHelper.TypeText(table._searchInput, "appsmith_");

      // assertHelper.AssertNetworkStatus("@postExecute");

      // agHelper.Sleep(2000);

      // agHelper.AssertElementAbsence(table._bodyCell("appsmith_"));
    });
  },
);
