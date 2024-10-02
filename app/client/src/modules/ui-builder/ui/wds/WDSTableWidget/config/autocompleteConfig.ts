import {
  generateTypeDef,
  type ExtraDef,
} from "utils/autocomplete/defCreatorUtils";
import {
  ALLOW_TABLE_WIDGET_SERVER_SIDE_FILTERING,
  type TableWidgetProps,
} from "../constants";
import type { AutocompletionDefinitions } from "WidgetProvider/constants";
import { DefaultAutocompleteDefinitions } from "widgets/WidgetUtils";
import { WDSTableWidget } from "../widget";

export const autocompleteConfig = (() => {
  return (widget: TableWidgetProps, extraDefsToDefine?: ExtraDef) => {
    const config: AutocompletionDefinitions = {
      "!doc":
        "The Table is the hero widget of Appsmith. You can display data from an API in a table, trigger an action when a user selects a row and even work with large paginated data sets",
      "!url": "https://docs.appsmith.com/widget-reference/table",
      selectedRow: generateTypeDef(widget.selectedRow, extraDefsToDefine),
      selectedRows: generateTypeDef(widget.selectedRows, extraDefsToDefine),
      selectedRowIndices: generateTypeDef(widget.selectedRowIndices),
      triggeredRow: generateTypeDef(widget.triggeredRow),
      updatedRow: generateTypeDef(widget.updatedRow),
      selectedRowIndex: "number",
      tableData: generateTypeDef(widget.tableData, extraDefsToDefine),
      pageNo: "number",
      pageSize: "number",
      isVisible: DefaultAutocompleteDefinitions.isVisible,
      searchText: "string",
      totalRecordsCount: "number",
      sortOrder: {
        column: "string",
        order: ["asc", "desc"],
      },
      updatedRows: generateTypeDef(widget.updatedRows, extraDefsToDefine),
      updatedRowIndices: generateTypeDef(widget.updatedRowIndices),
      triggeredRowIndex: generateTypeDef(widget.triggeredRowIndex),
      pageOffset: generateTypeDef(widget.pageOffset),
      tableHeaders: generateTypeDef(widget.tableHeaders),
      newRow: generateTypeDef(widget.newRow),
      isAddRowInProgress: "bool",
      previousPageVisited: generateTypeDef(widget.previousPageVisited),
      nextPageVisited: generateTypeDef(widget.nextPageButtonClicked),
    };

    if (
      WDSTableWidget.getFeatureFlag(ALLOW_TABLE_WIDGET_SERVER_SIDE_FILTERING)
    ) {
      config["filters"] = generateTypeDef(widget.filters);
    }

    return config;
  };
})();
