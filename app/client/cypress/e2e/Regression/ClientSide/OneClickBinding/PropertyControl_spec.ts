import * as _ from "../../../../support/Objects/ObjectsCore";
import { ChooseAndAssertForm } from "./spec_utility";
import locator from "../../../../locators/OneClickBindingLocator";
import CommonLocators from "../../../../locators/commonlocators.json";
import DatasourceEditor from "../../../../locators/DatasourcesEditor.json";

describe("One click binding control", () => {
  before(() => {
    _.entityExplorer.DragDropWidgetNVerify("tablewidgetv2");
  });

  it("1.should check the datasource selector and the form", () => {
    _.agHelper.AssertElementExist(locator.datasourceDropdownSelector);
    _.agHelper.GetNClick(locator.datasourceDropdownSelector);
    _.agHelper.AssertElementAbsence(locator.datasourceQueryBindHeaderSelector);
    _.agHelper.AssertElementExist(locator.datasourceGenerateAQuerySelector);
    _.agHelper.AssertElementExist(locator.datasourceOtherActionsSelector);

    _.entityExplorer.NavigateToSwitcher("Explorer");
    cy.wait(500);

    _.dataSources.CreateMockDB("Users");

    cy.wait(500);

    _.dataSources.CreateQueryAfterDSSaved();

    _.entityExplorer.NavigateToSwitcher("Widgets");

    _.entityExplorer.NavigateToSwitcher("Explorer");

    _.agHelper.GetNClick(locator.datasourceDropdownSelector);

    _.agHelper.AssertElementExist(locator.datasourceQueryBindHeaderSelector);

    _.agHelper.AssertElementLength(locator.datasourceQuerySelector, 1);

    _.agHelper.AssertElementExist(locator.datasourceGenerateAQuerySelector);

    _.agHelper.AssertElementExist(locator.datasourceSelector());

    _.agHelper.AssertElementExist(locator.datasourceOtherActionsSelector);

    _.agHelper.AssertElementExist(locator.otherActionSelector());

    _.agHelper.AssertElementExist(
      locator.otherActionSelector("Connect new datasource"),
    );

    _.agHelper.GetNClick(locator.otherActionSelector("Connect new datasource"));

    _.agHelper.AssertElementExist(locator.datasourcePage);

    _.agHelper.GetNClick(locator.backButton);

    _.agHelper.GetNClick(locator.datasourceDropdownSelector);

    _.agHelper.AssertElementExist(
      locator.otherActionSelector("Insert snippet"),
    );

    _.agHelper.GetNClick(locator.otherActionSelector("Insert snippet"));

    _.agHelper.AssertElementExist(CommonLocators.globalSearchModal);

    _.agHelper.TypeText(CommonLocators.globalSearchInput, "{esc}", 0, true);

    _.agHelper.GetNClick(locator.datasourceDropdownSelector);

    _.agHelper.AssertElementExist(
      locator.otherActionSelector("Insert binding"),
    );

    _.agHelper.GetNClick(locator.otherActionSelector("Insert binding"));

    _.propPane.ValidatePropertyFieldValue("Table data", "{{}}");

    _.propPane.UpdatePropertyFieldValue("Table data", "");

    _.propPane.EnableJSMode("Table data");

    _.agHelper.GetNClick(locator.datasourceDropdownSelector);

    _.agHelper.AssertElementAbsence(
      locator.datasourceDropdownOptionSelector("Query1"),
    );

    _.agHelper.GetNClick(locator.datasourceQuerySelector, 0);

    _.agHelper.AssertElementExist(locator.dropdownOptionSelector("Query1"));

    _.propPane.EnableJSMode("Table data");

    _.propPane.ValidatePropertyFieldValue("Table data", "{{Query1.data}}");

    _.propPane.UpdatePropertyFieldValue("Table data", "");

    _.propPane.EnableJSMode("Table data");

    ChooseAndAssertForm("New from Users", "Users", "public.users", "gender");

    _.propPane.MoveToTab("Style");

    _.propPane.MoveToTab("Content");

    ChooseAndAssertForm("New from sample Movies", "movies", "movies", "status");

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

    _.agHelper.GetNClick(locator.datasourceDropdownSelector);

    _.agHelper.GetNClick(locator.datasourceSelector("myinvalidds"));

    cy.wait("@getDatasourceStructure", { timeout: 20000 });

    _.agHelper.AssertElementExist(
      locator.tableError(
        "Appsmith server timed out when fetching structure. Please reach out to appsmith customer support to resolve this.",
      ),
    );
  });
});
