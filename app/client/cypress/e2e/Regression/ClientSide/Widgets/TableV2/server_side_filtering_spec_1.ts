import {
  agHelper,
  dataSources,
  draggableWidgets,
  entityExplorer,
  locators,
  propPane,
  table,
} from "../../../../../support/Objects/ObjectsCore";
import oneClickBindingLocator from "../../../../../locators/OneClickBindingLocator";
import { expandLoadMoreOptions } from "../../OneClickBinding/spec_utility";
import { featureFlagIntercept } from "../../../../../support/Objects/FeatureFlags";
import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";

const ALERT_SUCCESS_MSG = "Table data filtered";

describe(
  "Table widget v2: test server side filtering",
  { tags: ["@tag.Widget", "@tag.Table"] },
  function () {
    /**
     * Initialization flow:
     * 1. DnD Table widget
     * 2. Connect a datasource to this table
     * 3. Create a JS object
     * 4. Name this object as utils
     * 5. Bind it as a WHERE condition inside an SQL query
     */
    before(() => {
      featureFlagIntercept({
        release_table_serverside_filtering_enabled: true,
      });
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.TABLE, 300, 300);

      // turn on filtering for the table - it is disabled by default in this PR(#34593)
      table.ExpandIfCollapsedSection("search\\&filters");
      agHelper.GetNClick(".t--property-control-allowfiltering input");

      // Create SQL data-source
      agHelper.GetNClick(oneClickBindingLocator.datasourceDropdownSelector);
      agHelper.AssertElementExist(oneClickBindingLocator.otherActionSelector());
      agHelper.GetNClick(
        oneClickBindingLocator.otherActionSelector("Connect new datasource"),
      );

      dataSources.CreateDataSource("MySql");

      cy.get("@dsName").then(($dsName) => {
        dataSources.CreateQueryAfterDSSaved();
        cy.wait(500);

        EditorNavigation.ShowCanvas();
        agHelper.GetNClick(oneClickBindingLocator.datasourceDropdownSelector);

        expandLoadMoreOptions();
        agHelper.GetNClick(
          oneClickBindingLocator.datasourceSelector(
            $dsName as unknown as string,
          ),
        );

        agHelper.Sleep(3000); //for tables to populate for CI runs

        agHelper.GetNClick(oneClickBindingLocator.tableOrSpreadsheetDropdown);
        agHelper.GetNClick(
          oneClickBindingLocator.tableOrSpreadsheetDropdownOption("employees"),
        );

        agHelper.GetNClick(oneClickBindingLocator.connectData);
      });
    });

    it("1. should test that server side filtering properties exists in the property pane", function () {
      agHelper.AssertElementExist(
        propPane._propertyControl("serversidefiltering"),
      );
      propPane.TogglePropertyState("serversidefiltering");

      // Check if onTableFilterUpdate property is visible when server side filtering is turned on.
      agHelper.AssertElementExist(
        propPane._propertyControl("ontablefilterupdate"),
      );

      // set execute select SQL query action on table filter update:
      propPane.SelectPlatformFunction("onTableFilterUpdate", "Execute a query");
      agHelper.GetNClickByContains(".single-select", "Select_employees1");
      agHelper.GetNClick(propPane._actionAddCallback("success"));
      agHelper.GetNClick(locators._dropDownValue("Show alert"));
      agHelper.EnterActionValue("Message", ALERT_SUCCESS_MSG);
    });

    it("2. should test that select query gets executed on filter change and no data is filtered from client-side when serverside filtering is turned on", () => {
      table.ReadTableRowColumnData(0, 0, "v2").then(($cellData) => {
        expect(Number($cellData)).to.greaterThan(-1);
      });
      table.OpenNFilterTable("employeeNumber", "greater than", "1000");
      agHelper.WaitUntilToastDisappear(ALERT_SUCCESS_MSG);
      table.CloseFilter();
      table.ReadTableRowColumnData(0, 0, "v2").then(($cellData) => {
        expect(Number($cellData)).to.greaterThan(-1);
      });
    });

    it("3. should test that removing the table filter executes the query", () => {
      table.OpenFilter();
      table.RemoveFilter(true);
      agHelper.WaitUntilToastDisappear(ALERT_SUCCESS_MSG);

      //once table filter is removed assert that first row has id value greater than 0.
      table.ReadTableRowColumnData(0, 0, "v2").then(($cellData) => {
        expect(Number($cellData)).to.greaterThan(-1);
      });
    });

    it("4. should test that data is filtered client-side when serverside filtering is turned off", () => {
      propPane.TogglePropertyState("serversidefiltering", "Off");

      table.OpenNFilterTable("employeeNumber", "is equal to", "1002");
      table.CloseFilter();

      // check first row
      table.ReadTableRowColumnData(0, 0, "v2").then(($cellData) => {
        expect($cellData).to.eq("1002");
      });
    });
  },
);

describe(
  "Table v2: Server side filtering hidden behind feature flag",
  { tags: ["@tag.Widget", "@tag.Table"] },
  () => {
    before(() => {
      featureFlagIntercept({
        release_table_serverside_filtering_enabled: false,
      });
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.TABLE, 700, 300);
    });

    it("1. should test that server side filtering option and dtable.filters autocomplete should not be visible", () => {
      agHelper.AssertElementAbsence(
        propPane._propertyControl("serversidefiltering"),
      );
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.TEXT, 300, 700);
      EditorNavigation.SelectEntityByName("Text1", EntityType.Widget);
      propPane.TypeTextIntoField("Text", "{{Table1.filters");
      agHelper.AssertElementAbsence(locators._hints);
    });
  },
);
