import * as _ from "../../../../support/Objects/ObjectsCore";
import { ChooseAndAssertForm } from "./Utility";

describe("One click binding control", () => {
  before(() => {
    _.entityExplorer.DragDropWidgetNVerify("tablewidgetv2");
  });

  it("1.should check the datasource selector and the form", () => {
    _.agHelper.AssertElementExist(".t--one-click-binding-datasource-selector");
    _.agHelper.GetNClick(".t--one-click-binding-datasource-selector");
    _.agHelper.AssertElementAbsence(
      ".t--one-click-binding-datasource-selector--bind-to-query",
    );
    _.agHelper.AssertElementExist(
      ".t--one-click-binding-datasource-selector--generate-a-query",
    );
    _.agHelper.AssertElementExist(
      ".t--one-click-binding-datasource-selector--other-actions",
    );

    _.entityExplorer.NavigateToSwitcher("Explorer");

    _.dataSources.CreateMockDB("Users");

    cy.wait(500);

    _.dataSources.CreateQueryAfterDSSaved();

    _.entityExplorer.NavigateToSwitcher("Widgets");

    _.entityExplorer.NavigateToSwitcher("Explorer");

    _.agHelper.GetNClick(".t--one-click-binding-datasource-selector");

    _.agHelper.AssertElementExist(
      ".t--one-click-binding-datasource-selector--bind-to-query",
    );

    _.agHelper.AssertElementLength(
      ".t--one-click-binding-datasource-selector--query",
      1,
    );

    _.agHelper.AssertElementExist(
      ".t--one-click-binding-datasource-selector--generate-a-query",
    );

    _.agHelper.AssertElementExist(
      ".t--one-click-binding-datasource-selector--datasource",
    );

    _.agHelper.AssertElementExist(
      ".t--one-click-binding-datasource-selector--other-actions",
    );

    _.agHelper.AssertElementExist(
      ".t--one-click-binding-datasource-selector--other-action",
    );

    _.agHelper.AssertElementExist(
      ".t--one-click-binding-datasource-selector--other-action:contains('Connect New Datasource')",
    );

    _.agHelper.GetNClick(
      ".t--one-click-binding-datasource-selector--other-action:contains('Connect New Datasource')",
    );

    _.agHelper.AssertElementExist(".t--integrationsHomePage");

    _.agHelper.GetNClick(".t--back-button");

    _.agHelper.GetNClick(".t--one-click-binding-datasource-selector");

    _.agHelper.AssertElementExist(
      ".t--one-click-binding-datasource-selector--other-action:contains('Insert Snippet')",
    );

    _.agHelper.GetNClick(
      ".t--one-click-binding-datasource-selector--other-action:contains('Insert Snippet')",
    );

    _.agHelper.AssertElementExist(".t--global-search-modal");

    _.agHelper.GetNClick(".bp3-overlay-enter-done", 0, true);

    _.agHelper.GetNClick(".t--one-click-binding-datasource-selector");

    _.agHelper.AssertElementExist(
      ".t--one-click-binding-datasource-selector--other-action:contains('Insert Binding')",
    );

    _.agHelper.GetNClick(
      ".t--one-click-binding-datasource-selector--other-action:contains('Insert Binding')",
    );

    _.propPane.ValidatePropertyFieldValue("Table data", "{{}}");

    _.propPane.UpdatePropertyFieldValue("Table data", "");

    _.propPane.ToggleJsMode("Table data");

    _.agHelper.GetNClick(".t--one-click-binding-datasource-selector");

    _.agHelper.AssertElementAbsence(
      ".t--one-click-binding-datasource-selector .rc-select-selection-item:contains('Query1')",
    );

    _.agHelper.GetNClick(".t--one-click-binding-datasource-selector--query", 0);

    _.agHelper.AssertElementExist(
      ".rc-select-selection-item:contains('Query1')",
    );

    _.propPane.ToggleJsMode("Table data");

    _.propPane.ValidatePropertyFieldValue("Table data", "{{Query1.data}}");

    _.propPane.UpdatePropertyFieldValue("Table data", "");

    _.propPane.ToggleJsMode("Table data");

    ChooseAndAssertForm("New from Users", "Users", "public.users", "gender");

    _.propPane.MoveToTab("Style");

    _.propPane.MoveToTab("Content");

    ChooseAndAssertForm("New from sample Movies", "movies", "movies", "status");

    _.entityExplorer.NavigateToSwitcher("Explorer");

    _.agHelper.GetNClick("#entity-add_new_datasource");

    _.agHelper.GetNClick(".t--plugin-name:contains('MongoDB')");

    _.agHelper.TypeText(".t--edit-datasource-name input", "myinvalidds");

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

    _.agHelper.GetNClick(".t--one-click-binding-datasource-selector");

    _.agHelper.GetNClick(
      `.t--one-click-binding-datasource-selector--datasource:contains(myinvalidds)`,
    );

    cy.wait("@getDatasourceStructure", { timeout: 20000 });

    _.agHelper.AssertElementExist(
      ".t--one-click-binding-table-selector--error:contains(Appsmith server timed out when fetching structure. Please reach out to appsmith customer support to resolve this.)",
    );
  });
});
