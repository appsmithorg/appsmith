import { ContainerWidgetProps } from "widgets/ContainerWidget";
import { WidgetProps } from "widgets/BaseWidget";
import { WidgetTypes } from "constants/WidgetConstants";
import { getAllTableColumnKeys } from "components/designSystems/appsmith/TableComponent/TableHelpers";
import {
  ColumnProperties,
  CellAlignmentTypes,
  VerticalAlignmentTypes,
  ColumnTypes,
  TextSizes,
  FontStyleTypes,
} from "components/designSystems/appsmith/TableComponent/Constants";
import { Colors } from "constants/Colors";
import { ColumnAction } from "components/propertyControls/ColumnActionSelectorControl";

export const tableWidgetPropertyPaneMigrations = (
  currentDSL: ContainerWidgetProps<WidgetProps>,
) => {
  currentDSL.children = currentDSL.children?.map((children: WidgetProps) => {
    if (children.type === WidgetTypes.TABLE_WIDGET) {
      const hiddenColumns = children.hiddenColumns || [];
      const columnNameMap = children.columnNameMap;
      const columnSizeMap = children.columnSizeMap;
      const columnTypeMap = children.columnTypeMap;
      let tableColumns: string[] = [];
      if (children.tableData.length) {
        let tableData = [];
        try {
          if (!Array.isArray(children.tableData)) {
            tableData = JSON.parse(children.tableData);
          } else {
            tableData = children.tableData;
          }
        } catch (e) {
          tableData = [];
        }
        tableColumns = getAllTableColumnKeys(tableData);
      }
      const primaryColumns = children.columnOrder?.length
        ? children.columnOrder
        : tableColumns;
      children.primaryColumns = primaryColumns.map(
        (accessor: string, index: number) => {
          const column: ColumnProperties = {
            index: index,
            width:
              columnSizeMap && columnSizeMap[accessor]
                ? columnSizeMap[accessor]
                : 150,
            id: accessor,
            horizontalAlignment: CellAlignmentTypes.LEFT,
            verticalAlignment: VerticalAlignmentTypes.CENTER,
            columnType:
              columnTypeMap && columnTypeMap[accessor]
                ? columnTypeMap[accessor].type
                : ColumnTypes.TEXT,
            textColor: Colors.THUNDER,
            textSize: TextSizes.PARAGRAPH,
            fontStyle: FontStyleTypes.REGULAR,
            enableFilter: true,
            enableSort: true,
            isVisible: hiddenColumns.includes(accessor) ? false : true,
            isDerived: false,
            label:
              columnNameMap && columnNameMap[accessor]
                ? columnNameMap[accessor]
                : accessor,
            computedValue: "",
          };
          if (columnTypeMap && columnTypeMap[accessor]) {
            column.outputFormat = columnTypeMap[accessor].format || "";
            column.inputFormat = columnTypeMap[accessor].inputFormat || "";
          }
          return column;
        },
      );

      const columnActions = children.columnActions || [];
      const updatedDerivedColumns = columnActions.map(
        (action: ColumnAction, index: number) => {
          return {
            index: index,
            width: 150,
            id: action.id,
            label: action.label,
            columnType: "button",
            isVisible: true,
            isDerived: true,
            buttonLabel: action.label,
            buttonStyle: "#29CCA3",
            buttonLabelColor: "#FFFFFF",
            dynamicTrigger: action.dynamicTrigger,
          };
        },
      );
      if (updatedDerivedColumns.length) {
        children.primaryColumns = children.primaryColumns.concat(
          updatedDerivedColumns,
        );
      }
      children.textSize = "PARAGRAPH";
      children.horizontalAlignment = "LEFT";
      children.verticalAlignment = "CENTER";
      children.derivedColumns = updatedDerivedColumns;
    } else if (children.children && children.children.length > 0) {
      children = tableWidgetPropertyPaneMigrations(children);
    }
    return children;
  });
  return currentDSL;
};
