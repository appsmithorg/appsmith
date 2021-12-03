import { DependencyMap } from "utils/DynamicBindingUtils";
import {
  getDependenciesFromInverseDependencies,
  getDependencyChain,
} from "./helpers";

describe("getDependencies", () => {
  it("Check if getDependencies returns in a correct format", () => {
    const input = {
      "Button1.text": ["Input1.defaultText", "Button1"],
      "Input1.defaultText": ["Input1.text", "Input1"],
      "Input1.inputType": ["Input1.isValid", "Input1"],
      "Input1.text": ["Input1.isValid", "Input1.value", "Input1"],
      "Input1.isRequired": ["Input1.isValid", "Input1"],
      "Input1.isValid": ["Button1.isVisible", "Input1"],
      "Button1.isVisible": ["Button1"],
      Button1: ["Chart1.chartName"],
      "Chart1.chartName": ["Chart1"],
      "Input1.value": ["Input1"],
    };
    const output = {
      directDependencies: ["Input1"],
      inverseDependencies: ["Input1", "Chart1"],
    };

    expect(
      getDependenciesFromInverseDependencies(input, "Button1"),
    ).toStrictEqual(output);
  });
  it("Check if getDependencies returns correct dependencies when widget names are overlapping", () => {
    const input = {
      "SelectQuery.data": ["SelectQuery", "data_table.tableData"],
      "Input1.defaultText": ["Input1.text", "Input1"],
      "Input1.text": ["Input1.value", "Input1.isValid", "Input1"],
      "Input1.inputType": ["Input1.isValid", "Input1"],
      "Input1.isRequired": ["Input1.isValid", "Input1"],
      "Input1.isValid": ["Input1"],
      "Input1.value": ["Input1"],
      "data_table.defaultSelectedRow": [
        "data_table.selectedRowIndex",
        "data_table.selectedRowIndices",
        "data_table",
      ],
      "data_table.selectedRowIndex": [
        "Form1.isVisible",
        "data_table.selectedRow",
        "data_table",
      ],
      "Form1.isVisible": ["Form1"],
      "col_text_2.text": ["col_text_2.value", "col_text_2"],
      "col_text_2.value": ["col_text_2"],
      "col_text_1.text": ["col_text_1.value", "col_text_1"],
      "col_text_1.value": ["col_text_1"],
      "data_table.tableData": [
        "data_table.sanitizedTableData",
        "insert_col_input5.placeholderText",
        "insert_col_input2.placeholderText",
        "insert_col_input1.placeholderText",
        "data_table",
      ],
      "data_table.defaultSearchText": ["data_table.searchText", "data_table"],
      "data_table.sanitizedTableData": [
        "data_table.primaryColumns.Description.computedValue",
        "data_table.primaryColumns.Name.computedValue",
        "data_table.primaryColumns.rowIndex.computedValue",
        "data_table.primaryColumns.customColumn1.buttonLabel",
        "data_table.tableColumns",
        "data_table.filteredTableData",
        "data_table.selectedRow",
        "data_table.selectedRows",
        "data_table",
      ],
      "data_table.primaryColumns.Description.computedValue": [
        "data_table.primaryColumns.Description",
      ],
      "data_table.primaryColumns.Name.computedValue": [
        "data_table.primaryColumns.Name",
      ],
      "data_table.primaryColumns.rowIndex.computedValue": [
        "data_table.primaryColumns.rowIndex",
      ],
      "data_table.primaryColumns.customColumn1.buttonLabel": [
        "data_table.primaryColumns.customColumn1",
      ],
      "data_table.primaryColumns.customColumn1": ["data_table.primaryColumns"],
      "data_table.primaryColumns.rowIndex": ["data_table.primaryColumns"],
      "data_table.primaryColumns.Name": ["data_table.primaryColumns"],
      "data_table.primaryColumns.Description": ["data_table.primaryColumns"],
      "data_table.primaryColumns": [
        "data_table.tableColumns",
        "data_table.filteredTableData",
        "data_table",
      ],
      "data_table.sortOrder.column": [
        "data_table.tableColumns",
        "data_table.filteredTableData",
        "data_table.sortOrder",
      ],
      "data_table.sortOrder.order": [
        "data_table.tableColumns",
        "data_table.filteredTableData",
        "data_table.sortOrder",
      ],
      "data_table.columnOrder": ["data_table.tableColumns", "data_table"],
      "data_table.derivedColumns": [
        "data_table.filteredTableData",
        "data_table",
      ],
      "data_table.tableColumns": ["data_table.filteredTableData", "data_table"],
      "data_table.searchText": ["data_table.filteredTableData", "data_table"],
      "data_table.filters": ["data_table.filteredTableData", "data_table"],
      "data_table.filteredTableData": [
        "data_table.selectedRow",
        "data_table.selectedRows",
        "data_table",
      ],
      "data_table.selectedRow": ["colInput1.defaultText", "data_table"],
      "colInput1.defaultText": ["colInput1.text", "colInput1"],
      "colInput1.text": ["colInput1.value", "colInput1.isValid", "colInput1"],
      "colInput1.validation": ["colInput1.isValid", "colInput1"],
      "colInput1.inputType": ["colInput1.isValid", "colInput1"],
      "colInput1.isRequired": ["colInput1.isValid", "colInput1"],
      "colInput1.isValid": ["colInput1"],
      "colInput1.value": ["colInput1"],
      "Text13.text": ["Text13.value", "Text13"],
      "Text13.value": ["Text13"],
      "insert_col_input5.defaultText": [
        "insert_col_input5.text",
        "insert_col_input5",
      ],
      "insert_col_input5.text": [
        "insert_col_input5.value",
        "insert_col_input5.isValid",
        "insert_col_input5",
      ],
      "insert_col_input5.validation": [
        "insert_col_input5.isValid",
        "insert_col_input5",
      ],
      "insert_col_input5.inputType": [
        "insert_col_input5.isValid",
        "insert_col_input5",
      ],
      "insert_col_input5.isRequired": [
        "insert_col_input5.isValid",
        "insert_col_input5",
      ],
      "insert_col_input5.placeholderText": ["insert_col_input5"],
      "insert_col_input5.isValid": ["insert_col_input5"],
      "insert_col_input5.value": ["insert_col_input5"],
      "Text24.text": ["Text24.value", "Text24"],
      "Text24.value": ["Text24"],
      "insert_col_input2.defaultText": [
        "insert_col_input2.text",
        "insert_col_input2",
      ],
      "insert_col_input2.text": [
        "insert_col_input2.value",
        "insert_col_input2.isValid",
        "insert_col_input2",
      ],
      "insert_col_input2.validation": [
        "insert_col_input2.isValid",
        "insert_col_input2",
      ],
      "insert_col_input2.inputType": [
        "insert_col_input2.isValid",
        "insert_col_input2",
      ],
      "insert_col_input2.isRequired": [
        "insert_col_input2.isValid",
        "insert_col_input2",
      ],
      "insert_col_input2.placeholderText": ["insert_col_input2"],
      "insert_col_input2.isValid": ["insert_col_input2"],
      "insert_col_input2.value": ["insert_col_input2"],
      "Text22.text": ["Text22.value", "Text22"],
      "Text22.value": ["Text22"],
      "insert_col_input1.defaultText": [
        "insert_col_input1.text",
        "insert_col_input1",
      ],
      "insert_col_input1.text": [
        "insert_col_input1.value",
        "insert_col_input1.isValid",
        "insert_col_input1",
      ],
      "insert_col_input1.validation": [
        "insert_col_input1.isValid",
        "insert_col_input1",
      ],
      "insert_col_input1.inputType": [
        "insert_col_input1.isValid",
        "insert_col_input1",
      ],
      "insert_col_input1.isRequired": [
        "insert_col_input1.isValid",
        "insert_col_input1",
      ],
      "insert_col_input1.placeholderText": ["insert_col_input1"],
      "insert_col_input1.isValid": ["insert_col_input1"],
      "insert_col_input1.value": ["insert_col_input1"],
      "Text21.text": ["Text21.value", "Text21"],
      "Text21.value": ["Text21"],
      "Text12.text": ["Text12.value", "Text12"],
      "Text12.value": ["Text12"],
      "delete_button.buttonStyle": [
        "delete_button.prevButtonStyle",
        "delete_button",
      ],
      "delete_button.prevButtonStyle": ["delete_button"],
      "Button1.buttonStyle": ["Button1.prevButtonStyle", "Button1"],
      "Button1.prevButtonStyle": ["Button1"],
      "Text11.text": ["Text11.value", "Text11"],
      "Text11.value": ["Text11"],
      "Text16.text": ["Text16.value", "Text16"],
      "Text16.value": ["Text16"],
      "data_table.bottomRow": ["data_table.pageSize", "data_table"],
      "data_table.topRow": ["data_table.pageSize", "data_table"],
      "data_table.parentRowSpace": ["data_table.pageSize", "data_table"],
      "data_table.selectedRowIndices": [
        "data_table.selectedRows",
        "data_table",
      ],
      "data_table.selectedRows": ["data_table"],
      "data_table.pageSize": ["data_table"],
      "data_table.triggerRowSelection": ["data_table"],
      "data_table.sortOrder": ["data_table"],
    };
    const output = {
      directDependencies: [],
      inverseDependencies: [],
    };

    expect(
      getDependenciesFromInverseDependencies(input, "Input1"),
    ).toStrictEqual(output);
  });

  it("Get dependency chain", () => {
    const inputs: string[] = ["Button1.text", "DatePicker1.value"];
    const inverseDependencies: DependencyMap[] = [
      {
        "Button1.text": ["Input1.defaultText", "Button1"],
        "Input1.defaultText": ["Checkbox1.label", "Input1.text", "Input1"],
        "Checkbox1.LEFT": ["Checkbox1.alignWidget", "Checkbox1"],
        "Checkbox1.defaultCheckedState": ["Checkbox1.isChecked", "Checkbox1"],
        "Checkbox1.isRequired": ["Checkbox1.isValid", "Checkbox1"],
        "Checkbox1.isChecked": [
          "Checkbox1.isValid",
          "Checkbox1.value",
          "Checkbox1",
        ],
        "Checkbox1.value": ["Checkbox1"],
        "Checkbox1.isValid": ["Checkbox1"],
        "Checkbox1.alignWidget": ["Checkbox1"],
        "Checkbox1.label": ["Checkbox1"],
        "Input1.text": ["Input1.value", "Input1.isValid", "Input1"],
        "Input1.inputType": ["Input1.isValid", "Input1"],
        "Input1.isRequired": ["Input1.isValid", "Input1"],
        "Input1.isValid": ["Input1"],
        "Input1.value": ["Input1"],
      },
      {
        "DatePicker1.defaultDate": [
          "DatePicker1.value",
          "DatePicker1.selectedDate",
          "DatePicker1.formattedDate",
          "DatePicker1",
        ],
        "DatePicker1.value": [
          "DatePicker1.selectedDate",
          "DatePicker1.formattedDate",
          "DatePicker1",
        ],
        "DatePicker1.selectedDate": [
          "Text1.text",
          "DatePicker1.isValid",
          "DatePicker1",
        ],
        "Text1.text": ["Text1.value", "Text1"],
        "Text1.value": ["Text1"],
        "DatePicker1.dateFormat": ["DatePicker1.formattedDate", "DatePicker1"],
        "DatePicker1.isRequired": ["DatePicker1.isValid", "DatePicker1"],
        "DatePicker1.isValid": ["DatePicker1"],
        "DatePicker1.formattedDate": ["DatePicker1"],
      },
    ];
    const output = [["Input1.defaultText", "Checkbox1.label"], ["Text1.text"]];

    inputs.map((input: any, index) => {
      expect(getDependencyChain(input, inverseDependencies[index])).toEqual(
        output[index],
      );
    });
  });
});
