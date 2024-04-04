import { InlineEditingSaveOptions } from "../constants";
import { Colors } from "constants/Colors";
import type { WidgetDefaultProps } from "WidgetProvider/constants";
import { ResponsiveBehavior } from "layoutSystems/common/utils/constants";

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
  textSize: "0.875rem",
  horizontalAlignment: "LEFT",
  verticalAlignment: "CENTER",
  totalRecordsCount: 0,
  defaultPageSize: 0,
  dynamicPropertyPathList: [],
  borderColor: Colors.GREY_5,
  borderWidth: "1",
  dynamicBindingPathList: [],
  primaryColumns: {},
  tableData: "",
  columnWidthMap: {},
  columnOrder: [],
  enableClientSideSearch: true,
  isVisibleSearch: true,
  isVisibleFilters: true,
  isVisibleDownload: true,
  isVisiblePagination: true,
  isSortable: true,
  delimiter: ",",
  version: 2,
  inlineEditingSaveOption: InlineEditingSaveOptions.ROW_LEVEL,
  pageSize: 8,
} as unknown as WidgetDefaultProps;
