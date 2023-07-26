import {
  entityExplorer,
  propPane,
  agHelper,
  draggableWidgets,
  deployMode,
  table,
  locators,
  dataSources,
  jsEditor,
} from "../../../../../support/Objects/ObjectsCore";
import oneClickBindingLocator from "../../../../../locators/OneClickBindingLocator";
import { expandLoadMoreOptions } from "../../OneClickBinding/spec_utility";

const SQL_QUERY_GEN_FUNC = `
		const operatorMap = {
			"isEqualTo": "=",
			"notEqualTo": "!=",
			"greaterThan": ">",
			"greaterThanEqualTo": ">=",
			"lessThan": "<",
			"lessThanEqualTo": "<=",
			"": ""
		}

		if(Table1.filters.length === 0){
			return ""
		} else {
			// With reduce:
			return Table1.filters.reduce((acc, curr, index) => {
				const { condition, column, value, operator } = curr;
				let currentOperator = "";
				if(index === 0){
					if(Table1.filters.length === 1){
						currentOperator = "";
					} else {
						currentOperator = Table1.filters[1].operator;
					}
				} else if(index === Table1.filters.length - 1){
					currentOperator = "";
				} else {
					currentOperator = operator;
				}
				const filterCondition = \`\${index === 0 && column !== "" ? "WHERE" : ""} \$\{column} \$\{operatorMap[condition]} \$\{value} \$\{currentOperator} \`\;
				acc = acc + filterCondition;
				return acc;
			}, "");
		}

		return "";
`;

const SELECT_QUERY = `SELECT
*
FROM
public.users {{JSObject1.myFun1() }}
LIMIT
{{Table1.pageSize}} OFFSET {{Table1.pageOffset}}
`;

const ALERT_SUCCESS_MSG = "Table data filtered";

describe("Table widget v2: test server side filtering", function () {
  /**
   * Initialization flow:
   * 1. DnD Table widget
   * 2. Connect a datasource to this table
   * 3. Create a JS object
   * 4. Name this object as utils
   * 5. Bind it as a WHERE condition inside an SQL query
   */
  before(() => {
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.TABLE, 300, 300);

    // Create SQL data-source
    agHelper.GetNClick(oneClickBindingLocator.datasourceDropdownSelector);
    agHelper.AssertElementExist(oneClickBindingLocator.otherActionSelector());
    agHelper.GetNClick(
      oneClickBindingLocator.otherActionSelector("Connect new datasource"),
    );

    dataSources.CreateMockDB("Users").then(($createdMockUsers) => {
      dataSources.CreateQueryAfterDSSaved();
      cy.wait(500);

      entityExplorer.NavigateToSwitcher("Widgets");
      agHelper.GetNClick(oneClickBindingLocator.datasourceDropdownSelector);

      expandLoadMoreOptions();
      agHelper.GetNClick(
        oneClickBindingLocator.datasourceSelector($createdMockUsers),
      );

      agHelper.Sleep(3000); //for tables to populate for CI runs

      agHelper.GetNClick(oneClickBindingLocator.tableOrSpreadsheetDropdown);
      agHelper.GetNClick(
        oneClickBindingLocator.tableOrSpreadsheetDropdownOption("public.users"),
      );

      agHelper.GetNClick(oneClickBindingLocator.connectData);

      //Create JS object and update it with sql query generator function
      jsEditor.CreateJSObject(SQL_QUERY_GEN_FUNC);

      // Update Query for Where clause
      entityExplorer.SelectEntityByName("Select_public_users1", "Queries/JS");
      dataSources.EnterQuery(SELECT_QUERY);
      entityExplorer.NavigateToSwitcher("Widgets");
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
    agHelper.GetNClickByContains(".single-select", "Select_public_users1");
    agHelper.GetNClick(
      `${propPane._propertyControl("ontablefilterupdate")} ${
        propPane._actionCallbacks
      }`,
    );
    agHelper.GetNClick(propPane._actionAddCallback("success"));
    agHelper.GetNClick(locators._dropDownValue("Show alert"));
    agHelper.EnterActionValue("Message", ALERT_SUCCESS_MSG);
  });

  it("2. should test that select query gets executed on filter change", () => {
    table.OpenNFilterTable("id", "greater than", "10");
    agHelper.WaitUntilToastDisappear(ALERT_SUCCESS_MSG);
    table.CloseFilter();

    table.OpenFilter();
    table.OpenNFilterTable("id", "less than or equal to", "14", "AND", 1);
    agHelper.WaitUntilToastDisappear(ALERT_SUCCESS_MSG);

    // Verify table data here post filtering
    // check first row
    table.ReadTableRowColumnData(0, 0, "v2").then(($cellData) => {
      expect($cellData).to.eq("11");
    });

    // check last row
    table.ReadTableRowColumnData(3, 0, "v2").then(($cellData) => {
      expect($cellData).to.eq("14");
    });
  });

  it("3. should test that removing the table filter executes the query", () => {
    table.RemoveFilter(true);
    agHelper.WaitUntilToastDisappear(ALERT_SUCCESS_MSG);

    //once table filter is removed assert that first row has id value greater than 0.
    table.ReadTableRowColumnData(0, 0, "v2").then(($cellData) => {
      expect(Number($cellData)).to.greaterThan(-1);
    });
  });

  it("4. should test server side filtering in deployed mode", () => {
    /**
     * Flow:
     * 1. Add one filter and test the results
     * 2. Add multiple filters and test the results
     * 3. Remove filters and check if we get initial table data
     */

    deployMode.DeployApp();

    //1
    table.OpenNFilterTable("id", "greater than", "10");
    agHelper.WaitUntilToastDisappear(ALERT_SUCCESS_MSG);
    table.CloseFilter();
    table.ReadTableRowColumnData(0, 0, "v2").then(($cellData) => {
      expect($cellData).to.eq("11");
    });

    //2
    table.OpenFilter();
    table.OpenNFilterTable("id", "less than or equal to", "14", "AND", 1);
    agHelper.WaitUntilToastDisappear(ALERT_SUCCESS_MSG);
    table.ReadTableRowColumnData(3, 0, "v2").then(($cellData) => {
      expect($cellData).to.eq("14");
    });

    //3
    table.RemoveFilter(true);
    agHelper.WaitUntilToastDisappear(ALERT_SUCCESS_MSG);
    table.ReadTableRowColumnData(0, 0, "v2").then(($cellData) => {
      expect(Number($cellData)).to.greaterThan(-1);
    });
  });
});
