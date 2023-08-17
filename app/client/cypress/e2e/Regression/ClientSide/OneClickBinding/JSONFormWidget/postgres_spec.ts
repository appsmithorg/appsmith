import oneClickBindingLocator from "../../../../../locators/OneClickBindingLocator";
import { OneClickBinding } from "../spec_utility";
import {
  agHelper,
  entityExplorer,
  dataSources,
  draggableWidgets,
} from "../../../../../support/Objects/ObjectsCore";

const oneClickBinding = new OneClickBinding();

describe("JSONForm widget one click binding feature", () => {
  it("should check that queries are created and bound to JSONForm widget properly", () => {
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.JSONFORM, 450, 200);

    entityExplorer.NavigateToSwitcher("Explorer");

    dataSources.CreateDataSource("Postgres");

    cy.get("@dsName").then((dsName) => {
      entityExplorer.NavigateToSwitcher("Widgets");

      entityExplorer.SelectEntityByName("JSONForm1", "Widgets");

      oneClickBinding.ChooseAndAssertForm(
        `${dsName}`,
        dsName,
        "public.employees",
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
      agHelper.AssertElementExist(`[data-rbd-draggable-id=${column}]`);
    });
  });
});
