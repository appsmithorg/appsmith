import {
  entityExplorer,
  draggableWidgets,
  agHelper,
  dataSources,
  propPane,
} from "../../../../support/Objects/ObjectsCore";
import { OneClickBinding } from "./spec_utility";
import oneClickBindingLocator from "../../../../locators/OneClickBindingLocator";
import onboardingLocator from "../../../../locators/FirstTimeUserOnboarding.json";

const oneClickBinding = new OneClickBinding();

describe("excludeForAirgap", "One click binding control", () => {
  before(() => {
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.TABLE, 400);
  });

  it("1.Should check the datasource selector and the form", () => {
    agHelper.GetNClick(oneClickBindingLocator.datasourceDropdownSelector);
    agHelper.AssertElementAbsence(
      oneClickBindingLocator.datasourceQueryBindHeaderSelector,
    );
    agHelper.AssertElementExist(
      oneClickBindingLocator.datasourceGenerateAQuerySelector,
    );
    agHelper.AssertElementExist(
      oneClickBindingLocator.datasourceOtherActionsSelector,
    );

    entityExplorer.NavigateToSwitcher("Explorer");
    dataSources.CreateMockDB("Users").then(($createdMockUsers) => {
      dataSources.CreateQueryFromActiveTab($createdMockUsers, false);
    });

    entityExplorer.NavigateToSwitcher("Widgets");
    entityExplorer.NavigateToSwitcher("Explorer");
    agHelper.GetNClick(oneClickBindingLocator.datasourceDropdownSelector);

    agHelper.AssertElementExist(
      oneClickBindingLocator.datasourceQueryBindHeaderSelector,
    );

    agHelper.AssertElementLength(
      oneClickBindingLocator.datasourceQuerySelector,
      1,
    );

    agHelper.AssertElementExist(
      oneClickBindingLocator.datasourceGenerateAQuerySelector,
    );

    agHelper.AssertElementExist(oneClickBindingLocator.datasourceSelector());

    agHelper.AssertElementExist(
      oneClickBindingLocator.datasourceOtherActionsSelector,
    );

    agHelper.AssertElementExist(oneClickBindingLocator.otherActionSelector());
    agHelper.GetNClick(
      oneClickBindingLocator.otherActionSelector("Connect new datasource"),
    );

    agHelper.AssertElementExist(onboardingLocator.datasourcePage);

    agHelper.GetNClick(onboardingLocator.datasourceBackBtn);

    agHelper.GetNClick(oneClickBindingLocator.datasourceDropdownSelector);

    agHelper.GetNClick(
      oneClickBindingLocator.otherActionSelector("Insert binding"),
    );

    propPane.ValidatePropertyFieldValue("Table data", "{{}}");

    propPane.UpdatePropertyFieldValue("Table data", "");

    propPane.ToggleJSMode("Table data", false);

    agHelper.GetNClick(oneClickBindingLocator.datasourceDropdownSelector);

    agHelper.AssertElementAbsence(
      oneClickBindingLocator.datasourceDropdownOptionSelector("Query1"),
    );

    agHelper.GetNClick(oneClickBindingLocator.datasourceQuerySelector, 0);

    agHelper.AssertElementExist(
      oneClickBindingLocator.dropdownOptionSelector("Query1"),
    );

    propPane.ToggleJSMode("Table data");

    propPane.ValidatePropertyFieldValue("Table data", "{{Query1.data}}");

    propPane.UpdatePropertyFieldValue("Table data", "");

    propPane.ToggleJSMode("Table data", false);

    oneClickBinding.ChooseAndAssertForm(
      "New from Users",
      "Users",
      "public.users",
      "gender",
    );

    propPane.MoveToTab("Style");

    propPane.MoveToTab("Content");

    oneClickBinding.ChooseAndAssertForm(
      "New from sample Movies",
      "movies",
      "movies",
      "status",
    );

    entityExplorer.NavigateToSwitcher("Explorer");
    dataSources.NavigateToDSCreateNew();
    dataSources.CreatePlugIn("Mongo");
    agHelper.RenameWithInPane("myinvalidds", false);

    agHelper.UpdateInputValue(dataSources._host, "127.0.0.1");
    agHelper.UpdateInputValue(dataSources._port, "8000");

    dataSources.SaveDatasource();

    entityExplorer.NavigateToSwitcher("Widgets");

    agHelper.GetNClick(oneClickBindingLocator.datasourceDropdownSelector);

    agHelper.GetNClick(
      oneClickBindingLocator.datasourceSelector("myinvalidds"),
    );

    agHelper.AssertNetworkStatus("@postExecute");
    agHelper.AssertElementExist(
      oneClickBindingLocator.tableError(
        "Appsmith server timed out when fetching structure. Please reach out to appsmith customer support to resolve this.",
      ),
    );
  });
});
