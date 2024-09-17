import { InlineEditingSaveOptions } from "../constants";
import {
  BlueprintOperationTypes,
  type WidgetDefaultProps,
} from "WidgetProvider/constants";
import { ResponsiveBehavior } from "layoutSystems/common/utils/constants";
import { DEFAULT_DATA } from "../constants/data";
import type { WidgetProps } from "widgets/BaseWidget";
import type { DynamicPath } from "utils/DynamicBindingUtils";
import get from "lodash/get";

export const defaultsConfig = {
  responsiveBehavior: ResponsiveBehavior.Fill,
  canFreezeColumn: true,
  columnUpdatedAt: Date.now(),
  animateLoading: true,
  defaultSelectedRowIndex: 0,
  defaultSelectedRowIndices: [0],
  label: "Data",
  widgetName: "Table",
  searchKey: "",
  horizontalAlignment: "start",
  verticalAlignment: "center",
  totalRecordsCount: 0,
  defaultPageSize: 0,
  dynamicPropertyPathList: [],
  dynamicBindingPathList: [],
  primaryColumns: {},
  tableData: DEFAULT_DATA,
  columnWidthMap: {},
  columnOrder: [],
  enableClientSideSearch: true,
  isVisibleSearch: true,
  isVisibleFilters: true,
  isVisibleDownload: true,
  isVisiblePagination: true,
  isSortable: true,
  delimiter: ",",
  version: 1,
  inlineEditingSaveOption: InlineEditingSaveOptions.ROW_LEVEL,
  pageSize: 8,
  buttonLabel: "Action",
  buttonColor: "accent",
  buttonVariant: "filled",
  isVisible: true,
  blueprint: {
    operations: [
      {
        type: BlueprintOperationTypes.MODIFY_PROPS,
        fn: (widget: WidgetProps & { children?: WidgetProps[] }) => {
          const dynamicPropertyPathList: DynamicPath[] = [
            ...get(widget, "dynamicPropertyPathList", []),
          ];

          dynamicPropertyPathList.push({
            key: "tableData",
          });

          const updatePropertyMap = [
            {
              widgetId: widget.widgetId,
              propertyName: "dynamicPropertyPathList",
              propertyValue: dynamicPropertyPathList,
            },
          ];

          return updatePropertyMap;
        },
      },
    ],
  },
} as unknown as WidgetDefaultProps;
