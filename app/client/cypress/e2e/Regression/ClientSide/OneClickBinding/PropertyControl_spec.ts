import * as _ from "../../../../support/Objects/ObjectsCore";
import CommonLocators from "../../../../locators/commonlocators.json";
import DatasourceEditor from "../../../../locators/DatasourcesEditor.json";
import { OneClickBinding } from "./spec_utility";
import oneClickBindingLocator from "../../../../locators/OneClickBindingLocator";
import onboardingLocator from "../../../../locators/FirstTimeUserOnboarding.json";

const oneClickBinding = new OneClickBinding();

describe("One click binding control", () => {
  before(() => {
    _.entityExplorer.DragDropWidgetNVerify(_.draggableWidgets.TABLE, 400);
  });

  it("1.Should check the datasource selector and the form", () => {
    _.agHelper.GetNClick(oneClickBindingLocator.datasourceDropdownSelector);
    _.agHelper.AssertElementAbsence(
      oneClickBindingLocator.datasourceQueryBindHeaderSelector,
    );
    _.agHelper.AssertElementExist(
      oneClickBindingLocator.datasourceGenerateAQuerySelector,
    );
    _.agHelper.AssertElementExist(
      oneClickBindingLocator.datasourceOtherActionsSelector,
    );

    _.entityExplorer.NavigateToSwitcher("Explorer");
    _.dataSources.CreateMockDB("Users").then(($createdMockUsers) => {
      _.dataSources.CreateQueryFromActiveTab($createdMockUsers, false);
    });

    _.entityExplorer.NavigateToSwitcher("Widgets");
    _.entityExplorer.NavigateToSwitcher("Explorer");
    _.agHelper.GetNClick(oneClickBindingLocator.datasourceDropdownSelector);

    _.agHelper.AssertElementExist(
      oneClickBindingLocator.datasourceQueryBindHeaderSelector,
    );

    _.agHelper.AssertElementLength(
      oneClickBindingLocator.datasourceQuerySelector,
      1,
    );

    _.agHelper.AssertElementExist(
      oneClickBindingLocator.datasourceGenerateAQuerySelector,
    );

    _.agHelper.AssertElementExist(oneClickBindingLocator.datasourceSelector());

    _.agHelper.AssertElementExist(
      oneClickBindingLocator.datasourceOtherActionsSelector,
    );

    _.agHelper.AssertElementExist(oneClickBindingLocator.otherActionSelector());
    _.agHelper.GetNClick(
      oneClickBindingLocator.otherActionSelector("Connect new datasource"),
    );

    _.agHelper.AssertElementExist(onboardingLocator.datasourcePage);

    _.agHelper.GetNClick(onboardingLocator.datasourceBackBtn);

    _.agHelper.GetNClick(oneClickBindingLocator.datasourceDropdownSelector);

    _.agHelper.AssertElementExist(
      oneClickBindingLocator.otherActionSelector("Insert snippet"),
    );

    _.agHelper.GetNClick(
      oneClickBindingLocator.otherActionSelector("Insert snippet"),
    );

    _.agHelper.AssertElementExist(CommonLocators.globalSearchModal);

    _.agHelper.TypeText(CommonLocators.globalSearchInput, "{esc}", 0, true);

    _.agHelper.GetNClick(oneClickBindingLocator.datasourceDropdownSelector);

    _.agHelper.AssertElementExist(
      oneClickBindingLocator.otherActionSelector("Insert binding"),
    );

    _.agHelper.GetNClick(
      oneClickBindingLocator.otherActionSelector("Insert binding"),
    );

    _.propPane.ValidatePropertyFieldValue("Table data", "{{}}");

    _.propPane.UpdatePropertyFieldValue("Table data", "");

    _.propPane.ToggleJSMode("Table data", false);

    _.agHelper.GetNClick(oneClickBindingLocator.datasourceDropdownSelector);

    _.agHelper.AssertElementAbsence(
      oneClickBindingLocator.datasourceDropdownOptionSelector("Query1"),
    );

    _.agHelper.GetNClick(oneClickBindingLocator.datasourceQuerySelector, 0);

    _.agHelper.AssertElementExist(
      oneClickBindingLocator.dropdownOptionSelector("Query1"),
    );

    _.propPane.ToggleJSMode("Table data");

    _.propPane.ValidatePropertyFieldValue("Table data", "{{Query1.data}}");

    _.propPane.UpdatePropertyFieldValue("Table data", "");

    _.propPane.ToggleJSMode("Table data", false);

    oneClickBinding.ChooseAndAssertForm(
      "New from Users",
      "Users",
      "public.users",
      "gender",
    );

    _.propPane.MoveToTab("Style");

    _.propPane.MoveToTab("Content");

    oneClickBinding.ChooseAndAssertForm(
      "New from movies",
      "movies",
      "movies",
      "status",
    );

    _.entityExplorer.NavigateToSwitcher("Explorer");
    _.dataSources.CreatePlugIn("Mongo");

    _.agHelper.TypeText(
      DatasourceEditor.datasourceTitleInputLocator,
      "myinvalidds",
    );

    _.agHelper.TypeText(
      `[name="datasourceConfiguration.endpoints[0].host"]`,
      "127.0.0.1",
    );

    _.agHelper.TypeText(
      `[name="datasourceConfiguration.endpoints[0].port"]`,
      "8000",
    );

    _.dataSources.SaveDatasource();

    _.entityExplorer.NavigateToSwitcher("Widgets");

    _.agHelper.GetNClick(oneClickBindingLocator.datasourceDropdownSelector);

    _.agHelper.GetNClick(
      oneClickBindingLocator.datasourceSelector("myinvalidds"),
    );

    _.agHelper.ValidateNetworkStatus("@ValidateNetworkStatus");
    _.agHelper.AssertElementExist(
      oneClickBindingLocator.tableError(
        "Appsmith server timed out when fetching structure. Please reach out to appsmith customer support to resolve this.",
      ),
    );
  });
});
