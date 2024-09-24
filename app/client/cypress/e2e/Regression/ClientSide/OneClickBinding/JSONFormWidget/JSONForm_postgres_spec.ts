import oneClickBindingLocator from "../../../../../locators/OneClickBindingLocator";
import { OneClickBinding } from "../spec_utility";
import {
  agHelper,
  assertHelper,
  dataSources,
  draggableWidgets,
  entityExplorer,
  locators,
  table,
} from "../../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";
import PageList from "../../../../../support/Pages/PageList";

const oneClickBinding = new OneClickBinding();

describe(
  "JSONForm widget one click binding feature",
  { tags: ["@tag.Binding"] },
  () => {
    let datasourceName: string;
    it("1.Create flow: should check that queries are created and bound to table jsonform widget properly ", () => {
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.JSONFORM, 450, 200);

      dataSources.CreateDataSource("Postgres");

      cy.get("@dsName").then((dsName) => {
        datasourceName = dsName as unknown as string;

        EditorNavigation.SelectEntityByName("JSONForm1", EntityType.Widget);

        oneClickBinding.ChooseAndAssertForm(
          `${datasourceName}`,
          datasourceName,
          "public.employees",
          {
            formType: "Create records",
          },
        );
      });

      agHelper.GetNClick(oneClickBindingLocator.connectData);

      agHelper.Sleep(2000);

      const columns = [
        "last_name",
        "first_name",
        "title",
        "title_of_courtesy",
        "birth_date",
        "hire_date",
      ];

      columns.forEach((column) => {
        agHelper.AssertElementExist(locators._draggableFieldConfig(column));
      });
    });

    it("2.Update flow: should check that queries are created and bound to table jsonform widget properly ", () => {
      PageList.AddNewPage("New blank page");

      entityExplorer.DragDropWidgetNVerify(draggableWidgets.TABLE, 200, 200);
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.JSONFORM, 600, 400);

      EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);

      oneClickBinding.ChooseAndAssertForm(
        `${datasourceName}`,
        datasourceName,
        "public.employees",
        {
          searchableColumn: "first_name",
        },
      );

      agHelper.GetNClick(oneClickBindingLocator.connectData);

      assertHelper.AssertNetworkStatus("@postExecute");

      agHelper.Sleep(2000);

      EditorNavigation.SelectEntityByName("JSONForm1", EntityType.Widget);

      oneClickBinding.ChooseAndAssertForm(
        `${datasourceName}`,
        datasourceName,
        "public.employees",
        {
          formType: "Edit records",
          defaultValues: "Table1",
          dataIdentifier: "id",
        },
      );

      agHelper.GetNClick(oneClickBindingLocator.connectData);

      assertHelper.AssertNetworkStatus("@postExecute");

      agHelper.Sleep(2000);

      table.SelectTableRow(0, 1, true, "v2");

      table.ReadTableRowColumnData(0, 1, "v2").then((cellData) => {
        agHelper
          .GetText(locators._jsonFormInputField("last_name"), "val")
          .should("be.equal", cellData);
      });

      agHelper
        .GetElement(locators._jsonFormInputField("last_name"))
        .clear()
        .type("Doe");
      agHelper
        .GetText(locators._jsonFormInputField("last_name"), "val")
        .should("be.equal", "Doe");

      agHelper.GetNClick(locators._jsonFormSubmitBtn, 0, true);

      agHelper.Sleep(2000);

      // reloading because we don't create select query with json form, so we need to reload the page to get the updated data
      cy.reload();

      EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);

      table.ReadTableRowColumnData(0, 1, "v2").then((cellData) => {
        expect(cellData).to.eq("Doe");
      });
    });
  },
);
