import OneClickBindingLocator from "../../../../locators/OneClickBindingLocator";
import { featureFlagIntercept } from "../../../../support/Objects/FeatureFlags";
import * as _ from "../../../../support/Objects/ObjectsCore";
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
      featureFlagIntercept({
        rollout_js_enabled_one_click_binding_enabled: true,
      });

      _.dataSources.CreateDataSource("Postgres");

      cy.get("@dsName").then((dsName) => {
        datasourceName = dsName as unknown as string;
      });

      _.apiPage.CreateAndFillApi(
        _.dataManager.dsValues[_.dataManager.defaultEnviorment].mockApiUrl,
      );
      _.apiPage.RunAPI();
    });

    it("1. Table Widget one click binding in enabled JS mode for datasource and API", () => {
      _.entityExplorer.DragDropWidgetNVerify(_.draggableWidgets.TABLE);
      _.entityExplorer.DragDropWidgetNVerify(
        _.draggableWidgets.TABLE,
        300,
        400,
      );

      EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);

      oneClickBinding.ChooseAndAssertForm(
        `${datasourceName}`,
        datasourceName,
        "public.employees",
      );

      _.agHelper.GetNClick(OneClickBindingLocator.connectData);

      _.agHelper.AssertClassExists(
        _.locators._jsToggle("tabledata"),
        "is-active",
      );

      EditorNavigation.SelectEntityByName("Table2", EntityType.Widget);
      oneClickBinding.ChooseQuery(`Api1`);
      _.agHelper.AssertClassExists(
        _.locators._jsToggle("tabledata"),
        "is-active",
      );
    });

    it("2. Select Widget one click binding in enabled JS mode for datasource and API", () => {
      _.entityExplorer.DragDropWidgetNVerify(_.draggableWidgets.SELECT, 600);
      _.entityExplorer.DragDropWidgetNVerify(
        _.draggableWidgets.SELECT,
        600,
        200,
      );

      EditorNavigation.SelectEntityByName("Select1", EntityType.Widget);

      oneClickBinding.ChooseAndAssertForm(
        `${datasourceName}`,
        datasourceName,
        "public.employees",
        {
          label: "first_name",
          value: "last_name",
        },
      );

      _.agHelper.GetNClick(OneClickBindingLocator.connectData);

      _.agHelper.AssertClassExists(
        _.locators._jsToggle("sourcedata"),
        "is-active",
      );

      EditorNavigation.SelectEntityByName("Select2", EntityType.Widget);
      oneClickBinding.ChooseQuery(`Api1`);
      _.agHelper.AssertClassExists(
        _.locators._jsToggle("sourcedata"),
        "is-active",
      );
    });

    it("3. Multi Select Widget one click binding in enabled JS mode for datasource and API", () => {
      _.entityExplorer.DragDropWidgetNVerify(
        _.draggableWidgets.MULTISELECT,
        600,
        400,
      );
      _.entityExplorer.DragDropWidgetNVerify(
        _.draggableWidgets.MULTISELECT,
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
        }
      );

      _.agHelper.GetNClick(OneClickBindingLocator.connectData);

      _.agHelper.AssertClassExists(
        _.locators._jsToggle("sourcedata"),
        "is-active",
      );

      EditorNavigation.SelectEntityByName("MultiSelect2", EntityType.Widget);
      oneClickBinding.ChooseQuery(`Api1`);
      _.agHelper.AssertClassExists(
        _.locators._jsToggle("sourcedata"),
        "is-active",
      );
    });
  },
);
