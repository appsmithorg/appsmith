import { merge } from "lodash";
import type {
  PropertyUpdates,
  SnipingModeProperty,
} from "WidgetProvider/constants";
import type {
  WidgetQueryConfig,
  WidgetQueryGenerationFormConfig,
} from "WidgetQueryGenerators/types";
import type { WidgetProps } from "widgets/BaseWidget";
import { ColumnTypes, type TableWidgetProps } from "../constants";
import type { DynamicPath } from "utils/DynamicBindingUtils";
import { createEditActionColumn } from "../widget/utilities";
import { TableIcon, TableThumbnail } from "appsmith-icons";

export const methodsConfig = {
  IconCmp: TableIcon,
  ThumbnailCmp: TableThumbnail,
  getQueryGenerationConfig: (widget: WidgetProps) => {
    return {
      select: {
        limit: `${widget.widgetName}.pageSize`,
        where: `${widget.widgetName}.searchText`,
        offset: `${widget.widgetName}.pageOffset`,
        orderBy: `${widget.widgetName}.sortOrder.column`,
        sortOrder: `${widget.widgetName}.sortOrder.order !== "desc"`,
      },
      create: {
        value: `(${widget.widgetName}.newRow || {})`,
      },
      update: {
        value: `${widget.widgetName}.updatedRow`,
        where: `${widget.widgetName}.updatedRow`,
      },
      totalRecord: true,
    };
  },
  getPropertyUpdatesForQueryBinding: (
    queryConfig: WidgetQueryConfig,
    _widget: WidgetProps,
    formConfig: WidgetQueryGenerationFormConfig,
  ) => {
    const widget = _widget as TableWidgetProps;

    let modify = {};
    const dynamicPropertyPathList: DynamicPath[] = [];

    if (queryConfig.select) {
      modify = merge(modify, {
        tableData: queryConfig.select.data,
        onPageChange: queryConfig.select.run,
        serverSidePaginationEnabled: true,
        onSearchTextChanged: formConfig.searchableColumn
          ? queryConfig.select.run
          : undefined,
        onSort: queryConfig.select.run,
        enableClientSideSearch: !formConfig.searchableColumn,
        primaryColumnId: formConfig.primaryColumn,
        isVisibleDownload: false,
      });
    }

    if (queryConfig.create) {
      modify = merge(modify, {
        onAddNewRowSave: queryConfig.create.run,
        allowAddNewRow: true,
        ...Object.keys(widget.primaryColumns).reduce(
          (prev: Record<string, boolean>, curr) => {
            if (formConfig.primaryColumn !== curr) {
              prev[`primaryColumns.${curr}.isEditable`] = true;
              prev[`primaryColumns.${curr}.isCellEditable`] = true;
            }

            prev[`showInlineEditingOptionDropdown`] = true;

            return prev;
          },
          {},
        ),
      });
    }

    if (queryConfig.update) {
      let editAction = {};

      if (
        !Object.values(widget.primaryColumns).some(
          (column) => column.columnType === ColumnTypes.EDIT_ACTIONS,
        )
      ) {
        editAction = Object.values(createEditActionColumn(widget)).reduce(
          (
            prev: Record<string, unknown>,
            curr: {
              propertyPath: string;
              propertyValue: unknown;
              isDynamicPropertyPath?: boolean;
            },
          ) => {
            prev[curr.propertyPath] = curr.propertyValue;

            if (curr.isDynamicPropertyPath) {
              dynamicPropertyPathList.push({ key: curr.propertyPath });
            }

            return prev;
          },
          {},
        );
      }

      modify = merge(modify, {
        ...editAction,
        [`primaryColumns.EditActions1.onSave`]: queryConfig.update.run,
      });
    }

    if (queryConfig.total_record) {
      modify = merge(modify, {
        totalRecordsCount: queryConfig.total_record.data,
      });
    }

    return {
      modify,
      dynamicUpdates: {
        dynamicPropertyPathList,
      },
    };
  },
  getSnipingModeUpdates: (
    propValueMap: SnipingModeProperty,
  ): PropertyUpdates[] => {
    return [
      {
        propertyPath: "tableData",
        propertyValue: propValueMap.data,
        isDynamicPropertyPath: !!propValueMap.isDynamicPropertyPath,
      },
    ];
  },
  getOneClickBindingConnectableWidgetConfig: (widget: WidgetProps) => {
    return {
      widgetBindPath: `${widget.widgetName}.selectedRow`,
      message: `Make sure ${widget.widgetName} is bound to the same data source`,
    };
  },
};
