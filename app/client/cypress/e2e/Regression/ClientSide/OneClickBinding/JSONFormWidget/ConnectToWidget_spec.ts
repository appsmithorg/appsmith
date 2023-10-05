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
  propPane,
} from "../../../../../support/Objects/ObjectsCore";

const oneClickBinding = new OneClickBinding();

describe("JSONForm widget one click binding feature", () => {
  let datasourceName: string;

  it("1.Connect to a table widget", () => {
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.TABLE, 200, 200);
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.JSONFORM, 600, 400);

    entityExplorer.NavigateToSwitcher("Explorer");

    dataSources.CreateDataSource("Postgres");

    cy.get("@dsName").then((dsName) => {
      datasourceName = dsName as unknown as string;
      entityExplorer.NavigateToSwitcher("Widgets");

      entityExplorer.SelectEntityByName("Table1", "Widgets");

      oneClickBinding.ChooseAndAssertForm(
        `${datasourceName}`,
        datasourceName,
        "public.employees",
        {
          searchableColumn: "first_name",
        },
      );
    });

    agHelper.GetNClick(oneClickBindingLocator.connectData);

    assertHelper.AssertNetworkStatus("@postExecute");

    agHelper.Sleep(2000);

    entityExplorer.NavigateToSwitcher("Widgets");

    entityExplorer.SelectEntityByName("JSONForm1", "Widgets");

    agHelper.GetNClick(oneClickBindingLocator.datasourceDropdownSelector);
    agHelper.GetNClick(
      oneClickBindingLocator.datasourceQuerySelector("Table1"),
    );

    agHelper.Sleep(2000);

    table.SelectTableRow(0, 1, true, "v2");

    table.ReadTableRowColumnData(0, 1, "v2").then((cellData) => {
      agHelper
        .GetText(locators._jsonFormInputField("last_name"), "val")
        .should("be.equal", cellData);
    });

    agHelper.GetNClick(locators._jsonFormSubmitBtn, 0, true);

    agHelper.AssertElementVisibility(locators._toastMsg);
    agHelper.AssertElementVisibility(
      locators._specificToast("onSubmit event is not configured for JSONForm1"),
    );
  });

  it("Connect to a list widget", () => {
    entityExplorer.AddNewPage("New blank page");

    entityExplorer.DragDropWidgetNVerify(draggableWidgets.LIST_V2, 200, 200);
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.JSONFORM, 600, 400);

    agHelper.GetNClick(oneClickBindingLocator.datasourceDropdownSelector);
    agHelper.GetNClick(oneClickBindingLocator.datasourceQuerySelector("List1"));

    agHelper.Sleep(2000);

    entityExplorer.NavigateToSwitcher("Widgets");

    entityExplorer.SelectEntityByName("List1", "Widgets");

    propPane.UpdatePropertyFieldValue("Default selected item", "001");

    agHelper
      .GetText(locators._jsonFormInputField("name"), "val")
      .then((text) => {
        agHelper.Sleep(500);
        agHelper.GetText(".t--widget-textwidget span", "text").then((val) => {
          expect(val).to.eq(text);
        });
      });

    agHelper.GetNClick(locators._jsonFormSubmitBtn, 0, true);

    agHelper.AssertElementVisibility(locators._toastMsg);
    agHelper.AssertElementVisibility(
      locators._specificToast("onSubmit event is not configured for JSONForm1"),
    );
  });
});
