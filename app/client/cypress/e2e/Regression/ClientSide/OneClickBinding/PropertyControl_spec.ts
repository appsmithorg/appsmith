import * as _ from "../../../../support/Objects/ObjectsCore";
import CommonLocators from "../../../../locators/commonlocators.json";
import DatasourceEditor from "../../../../locators/DatasourcesEditor.json";
import { OneClickBinding } from "./spec_utility";

const oneClickBinding = new OneClickBinding();

describe("One click binding control", () => {
  before(() => {
    _.entityExplorer.DragDropWidgetNVerify("tablewidgetv2");
  });

  it("1.should check the datasource selector and the form", () => {
    _.agHelper.AssertElementExist(
      oneClickBinding.locator.datasourceDropdownSelector,
    );
    _.agHelper.GetNClick(oneClickBinding.locator.datasourceDropdownSelector);
    _.agHelper.AssertElementAbsence(
      oneClickBinding.locator.datasourceQueryBindHeaderSelector,
    );
    _.agHelper.AssertElementExist(
      oneClickBinding.locator.datasourceGenerateAQuerySelector,
    );
    _.agHelper.AssertElementExist(
      oneClickBinding.locator.datasourceOtherActionsSelector,
    );

    _.entityExplorer.NavigateToSwitcher("Explorer");
    cy.wait(500);

    _.dataSources.CreateMockDB("Users");

    cy.wait(500);

    _.dataSources.CreateQueryAfterDSSaved();

    _.entityExplorer.NavigateToSwitcher("Widgets");

    _.entityExplorer.NavigateToSwitcher("Explorer");

    _.agHelper.GetNClick(oneClickBinding.locator.datasourceDropdownSelector);

    _.agHelper.AssertElementExist(
      oneClickBinding.locator.datasourceQueryBindHeaderSelector,
    );

    _.agHelper.AssertElementLength(
      oneClickBinding.locator.datasourceQuerySelector,
      1,
    );

    _.agHelper.AssertElementExist(
      oneClickBinding.locator.datasourceGenerateAQuerySelector,
    );

    _.agHelper.AssertElementExist(oneClickBinding.locator.datasourceSelector());

    _.agHelper.AssertElementExist(
      oneClickBinding.locator.datasourceOtherActionsSelector,
    );

    _.agHelper.AssertElementExist(
      oneClickBinding.locator.otherActionSelector(),
    );

    _.agHelper.AssertElementExist(
      oneClickBinding.locator.otherActionSelector("Connect new datasource"),
    );

    _.agHelper.GetNClick(
      oneClickBinding.locator.otherActionSelector("Connect new datasource"),
    );

    _.agHelper.AssertElementExist(
      oneClickBinding.onboardingLocator.datasourcePage,
    );

    _.agHelper.GetNClick(oneClickBinding.onboardingLocator.datasourceBackBtn);

    _.agHelper.GetNClick(oneClickBinding.locator.datasourceDropdownSelector);

    _.agHelper.AssertElementExist(
      oneClickBinding.locator.otherActionSelector("Insert snippet"),
    );

    _.agHelper.GetNClick(
      oneClickBinding.locator.otherActionSelector("Insert snippet"),
    );

    _.agHelper.AssertElementExist(CommonLocators.globalSearchModal);

    _.agHelper.TypeText(CommonLocators.globalSearchInput, "{esc}", 0, true);

    _.agHelper.GetNClick(oneClickBinding.locator.datasourceDropdownSelector);

    _.agHelper.AssertElementExist(
      oneClickBinding.locator.otherActionSelector("Insert binding"),
    );

    _.agHelper.GetNClick(
      oneClickBinding.locator.otherActionSelector("Insert binding"),
    );

    _.propPane.ValidatePropertyFieldValue("Table data", "{{}}");

    _.propPane.UpdatePropertyFieldValue("Table data", "");

    _.propPane.ToggleJsMode("Table data");

    _.agHelper.GetNClick(oneClickBinding.locator.datasourceDropdownSelector);

    _.agHelper.AssertElementAbsence(
      oneClickBinding.locator.datasourceDropdownOptionSelector("Query1"),
    );

    _.agHelper.GetNClick(oneClickBinding.locator.datasourceQuerySelector, 0);

    _.agHelper.AssertElementExist(
      oneClickBinding.locator.dropdownOptionSelector("Query1"),
    );

    _.propPane.ToggleJsMode("Table data");

    _.propPane.ValidatePropertyFieldValue("Table data", "{{Query1.data}}");

    _.propPane.UpdatePropertyFieldValue("Table data", "");

    _.propPane.ToggleJsMode("Table data");

    oneClickBinding.ChooseAndAssertForm(
      "New from Users",
      "Users",
      "public.users",
      "gender",
    );

    _.propPane.MoveToTab("Style");

    _.propPane.MoveToTab("Content");

    oneClickBinding.ChooseAndAssertForm(
      "New from sample Movies",
      "movies",
      "movies",
      "status",
    );

    _.entityExplorer.NavigateToSwitcher("Explorer");

    _.agHelper.GetNClick("#entity-add_new_datasource");

    _.agHelper.GetNClick(".t--plugin-name:contains('MongoDB')");

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

    _.agHelper.GetNClick(oneClickBinding.locator.datasourceDropdownSelector);

    _.agHelper.GetNClick(
      oneClickBinding.locator.datasourceSelector("myinvalidds"),
    );

    cy.wait("@getDatasourceStructure", { timeout: 20000 });

    _.agHelper.AssertElementExist(
      oneClickBinding.locator.tableError(
        "Appsmith server timed out when fetching structure. Please reach out to appsmith customer support to resolve this.",
      ),
    );
  });
});
