import OneClickBindingLocator from "../../../../locators/OneClickBindingLocator";
import {
  agHelper,
  apiPage,
  dataManager,
  dataSources,
  draggableWidgets,
  entityExplorer,
  locators,
  propPane,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";
import { OneClickBinding } from "./spec_utility";

const oneClickBinding = new OneClickBinding();

describe(
  "Set Default JSMode to be enabled for 1-click binding",
  { tags: ["@tag.Binding"] },
  () => {
    let datasourceName: string;
    before(() => {
      dataSources.CreateDataSource("Postgres");

      cy.get("@dsName").then((dsName) => {
        datasourceName = dsName as unknown as string;
      });

      apiPage.CreateAndFillApi(
        dataManager.dsValues[dataManager.defaultEnviorment].mockApiUrl,
      );
      apiPage.RunAPI();
    });

    it("1. Table Widget one click binding in enabled JS mode for datasource and API", () => {
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.TABLE);
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.TABLE, 300, 400);

      EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);

      oneClickBinding.ChooseAndAssertForm(
        `${datasourceName}`,
        datasourceName,
        "public.employees",
      );

      agHelper.GetNClick(OneClickBindingLocator.connectData);

      agHelper.AssertClassExists(locators._jsToggle("tabledata"), "is-active");

      EditorNavigation.SelectEntityByName("Table2", EntityType.Widget);
      oneClickBinding.ChooseQuery(`Api1`);
      agHelper.AssertClassExists(locators._jsToggle("tabledata"), "is-active");
    });

    it("2. Select Widget one click binding in enabled JS mode for datasource and API", () => {
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.SELECT, 600);
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.SELECT, 600, 200);

      EditorNavigation.SelectEntityByName("Select1", EntityType.Widget);

      propPane.ToggleJSMode("sourcedata", false);
      oneClickBinding.ChooseAndAssertForm(
        `${datasourceName}`,
        datasourceName,
        "public.employees",
        {
          label: "first_name",
          value: "last_name",
        },
      );

      agHelper.GetNClick(OneClickBindingLocator.connectData);
      agHelper.AssertClassExists(locators._jsToggle("sourcedata"), "is-active");

      EditorNavigation.SelectEntityByName("Select2", EntityType.Widget);
      propPane.ToggleJSMode("sourcedata", false);
      oneClickBinding.ChooseQuery(`Api1`);
      agHelper.AssertClassExists(locators._jsToggle("sourcedata"), "is-active");
    });

    it("3. Multi Select Widget one click binding in enabled JS mode for datasource and API", () => {
      entityExplorer.DragDropWidgetNVerify(
        draggableWidgets.MULTISELECT,
        600,
        400,
      );
      entityExplorer.DragDropWidgetNVerify(
        draggableWidgets.MULTISELECT,
        600,
        800,
      );

      EditorNavigation.SelectEntityByName("MultiSelect1", EntityType.Widget);

      oneClickBinding.ChooseAndAssertForm(
        `${datasourceName}`,
        datasourceName,
        "public.employees",
        {
          label: "first_name",
          value: "last_name",
        },
      );

      agHelper.GetNClick(OneClickBindingLocator.connectData);

      agHelper.AssertClassExists(locators._jsToggle("sourcedata"), "is-active");

      EditorNavigation.SelectEntityByName("MultiSelect2", EntityType.Widget);
      oneClickBinding.ChooseQuery(`Api1`);
      agHelper.AssertClassExists(locators._jsToggle("sourcedata"), "is-active");
    });
  },
);
