import {
  entityExplorer,
  propPane,
  agHelper,
  draggableWidgets,
  table,
  dataSources,
  locators,
} from "../../../../../../support/Objects/ObjectsCore";
import oneClickBindingLocator from "../../../../../../locators/OneClickBindingLocator";
import { expandLoadMoreOptions } from "../../../../../../e2e/Regression/ClientSide/OneClickBinding/spec_utility";
import {
  getWidgetSelector,
  WIDGET,
} from "../../../../../../locators/WidgetLocators";

describe("Table widget v2: select column displayAs property test", function () {
  before(() => {
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.TABLE, 300, 300);

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

      entityExplorer.NavigateToSwitcher("Widgets");
      agHelper.GetNClick(oneClickBindingLocator.datasourceDropdownSelector);

      expandLoadMoreOptions();
      agHelper.GetNClick(
        oneClickBindingLocator.datasourceSelector($dsName as unknown as string),
      );

      agHelper.Sleep(3000); //for tables to populate for CI runs

      agHelper.GetNClick(oneClickBindingLocator.tableOrSpreadsheetDropdown);
      agHelper.GetNClick(
        oneClickBindingLocator.tableOrSpreadsheetDropdownOption("employees"),
      );

      agHelper.GetNClick(oneClickBindingLocator.connectData);
    });
  });

  /**
   * Test cases:
   *
   * CONTROL VISIBILITY ========
   * 1. Check if the property displayAs is available whenever column type is select.
   * 2. Check if the computed value helperText is present.
   *
   * EDITING ========
   * 5. Check that while editing a cell in displayAs = label, the select's value is set in the table's data rather than the actual label
   * 6. Check that while editing a cell in displayAs = value, the select's value appears in the table's data always.
   *
   * COMPUTED VALUE AND ABSENCE ========
   * 3. Check that select options value are being present on table when displayAs = value
   * 4. Check that select options label are being present for that respective value when displayAs = label
   * 7. When computed value is not present in the select options then we show the error in the select option field with the row number where the error has occured. = TODO
   * 8. When computed value is not present in the select options and displayAs = label, then table cell should show empty cell.
   * 9. When computed value is not present in the select options and displayAs = value, then table cell should have that select' value property.
   *
   * MISC ========
   * 10. For new added row, there are no validations of computed value = Manual
   * 11. When display as is set to value, we show the computed value as it is even if labels are missing
   * 12. When computed value is not select options, we show error in computed value but still the parsed=select options = TODO
   * 13. Check if the sorting, filtering and searching is happening based on the select cell's value property. = Manual
   */
  it("1. Check if property displayAs, helperText are visible", function () {
    /**
     * Cases: 1,2
     * Flow:
     * 1. Select officeCode column,
     * 2. Change column type to select
     * 3. Check for helperText
     * 4. Check for displayAs property visiblity
     */

    table.ChangeColumnType("officeCode", "Select", "v2");
    table.EditColumn("officeCode", "v2");
    agHelper.GetNAssertContains(
      locators._helperText,
      "Each computed value here represents default value/display value",
    );
    agHelper.AssertElementExist(propPane._propertyControl("displayas"));
  });

  it("2. Check that select options value and label are being present on table when displayAs = value or label", function () {
    /**
     * Cases: 3, 4
     * Flow:
     * 1. Add Select options
     * 2. Check that all select values are present in table
     * 3. Change displayAs = label and check if all labels are present
     */

    propPane.UpdatePropertyFieldValue(
      "Options",
      `{{["Germany", "China", "India", "USA", "Japan", "Europe"].map((item, index) => ({
        label: item,
        value: (index+ 1).toString()
    }))}}`,
    );

    table.ReadTableRowColumnData(0, 5, "v2").then(($cellData) => {
      expect($cellData).to.eq("1");
    });
    table.ReadTableRowColumnData(4, 5, "v2").then(($cellData) => {
      expect($cellData).to.eq("4");
    });

    propPane.SelectPropertiesDropDown("Display as", "Label");

    table.ReadTableRowColumnData(0, 5, "v2").then(($cellData) => {
      expect($cellData).to.eq("Germany");
    });
    table.ReadTableRowColumnData(4, 5, "v2").then(($cellData) => {
      expect($cellData).to.eq("USA");
    });
  });

  it("3. Check computed value appearance in table and validation error in select options", function () {
    /**
     * Cases: 7, 8, 9
     * Flow:
     * 1. Change the column to plain text
     * 2. Change the cell's value to something that is not present in select options.
     * 3. Check for validation error
     * 4. Check the cells value for both displayAs values
     */

    agHelper.SelectDropdownList("Column type", "Plain text");
    table.EditTableCell(1, 5, "27");
    agHelper.SelectDropdownList("Column type", "Select");

    table.ReadTableRowColumnData(1, 5, "v2").then(($cellData) => {
      expect($cellData).to.eq("");
    });

    propPane.SelectPropertiesDropDown("Display as", "Value");

    table.ReadTableRowColumnData(1, 5, "v2").then(($cellData) => {
      expect($cellData).to.eq("27");
    });

    // TODO(Keyur): Check validation error in select option
    // agHelper.GetNClick(
    //   `${propPane._propertyControl("options")}.t--property-control-wrapper`,
    //   0,
    //   true,
    //   3500,
    // );
    // agHelper.VerifyEvaluatedErrorMessage(
    //   "Computed Value at row: [2] is not present in the select options.",
    // );
  });

  it("4. Check that while editing cell's value is changed to label or value of select options based on displayAs property", () => {
    /**
     * Flow:
     * 1. Dnd text widget and map it to computed value of officecode column
     * 2. Change to displayAs=value -> EDIT -> Check the computedValue and cell value
     * 3. Change to displayAs=label -> EDIT -> Check the computedValue and cell value
     */
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.TEXT, 300, 600);
    propPane.TypeTextIntoField(
      "Text",
      "{{Table1.primaryColumns.officeCode.computedValue}}",
    );

    // Click on edit icon of select cell
    agHelper.HoverElement(table._tableRow(2, 5, "v2"));
    agHelper.GetNClick(
      table._tableRow(2, 5, "v2") + " " + table._editCellIconDiv,
      0,
      true,
    );

    agHelper.ContainsNClick("China", 0);
    table.ReadTableRowColumnData(2, 5, "v2").then(($cellData) => {
      expect($cellData).to.eq("2");
    });
    agHelper.GetText(getWidgetSelector(WIDGET.TEXT)).then((value) => {
      expect(value).to.equal(`[  "1",  "27",  "2",  "6",  "4"]`);
    });

    // open table property pane:
    agHelper.GetNClick(getWidgetSelector(WIDGET.TABLE), 0, true);
    propPane.SelectPropertiesDropDown("Display as", "Label");

    agHelper.HoverElement(table._tableRow(2, 5, "v2"));
    agHelper.GetNClick(
      table._tableRow(2, 5, "v2") + " " + table._editCellIconDiv,
      0,
      true,
    );
    agHelper.ContainsNClick("India", 0);
    table.ReadTableRowColumnData(2, 5, "v2").then(($cellData) => {
      expect($cellData).to.eq("India");
    });
    agHelper.GetText(getWidgetSelector(WIDGET.TEXT)).then((value) => {
      expect(value).to.equal(`[  "1",  "27",  "3",  "6",  "4"]`);
    });
  });

  it("5. Check");
});
