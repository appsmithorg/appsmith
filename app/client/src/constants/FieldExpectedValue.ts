import { WidgetType } from "constants/WidgetConstants";

const FIELD_VALUES: Record<
  WidgetType | "API_ACTION",
  Record<string, string>
> = {
  API_ACTION: {
    body: "JSON",
    params: "string",
    headers: "string",
    path: "string",
  },
  CANVAS_WIDGET: {},
  ICON_WIDGET: {},
  SKELETON_WIDGET: {},
  CONTAINER_WIDGET: {
    backgroundColor: "string",
    isVisible: "boolean",
  },
  DATE_PICKER_WIDGET: {
    defaultDate: "Date",
    isRequired: "boolean",
    isVisible: "boolean",
    isDisabled: "boolean",
    // onDateSelected: "Function Call",
  },
  TABLE_WIDGET: {
    tableData: "Array<Object>",
    serverSidePaginationEnabled: "boolean",
    isVisible: "boolean",
    exportPDF: "boolean",
    exportExcel: "boolean",
    exportCsv: "boolean",
    // onRowSelected: "Function Call",
    // onPageChange: "Function Call",
  },
  VIDEO_WIDGET: {
    url: "string",
    autoPlay: "boolean",
    isVisible: "boolean",
  },
  IMAGE_WIDGET: {
    image: "string",
    defaultImage: "string",
    isVisible: "boolean",
  },
  RADIO_GROUP_WIDGET: {
    options: "Array<{ label: string, value: string }>",
    defaultOptionValue: "string",
    isRequired: "boolean",
    isVisible: "boolean",
    // onSelectionChange: "Function Call",
  },
  TABS_WIDGET: {
    tabs:
      "Array<{ label: string, id: string(unique), widgetId: string(unique) }>",
    selectedTab: "string",
    isVisible: "boolean",
  },
  CHART_WIDGET: {
    chartName: "string",
    chartType: "LINE_CHART | BAR_CHART | PIE_CHART | COLUMN_CHART | AREA_CHART",
    xAxisName: "string",
    yAxisName: "string",
    isVisible: "boolean",
  },
  MODAL_WIDGET: {
    canOutsideClickClose: "boolean",
    size: "MODAL_LARGE | MODAL_SMALL",
  },
  INPUT_WIDGET: {
    inputType: "string",
    placeholderText: "string",
    defaultText: "string",
    regex: "string",
    errorMessage: "string",
    isRequired: "boolean",
    isVisible: "boolean",
    isDisabled: "boolean",
    // onTextChanged: "Function Call",
  },
  DROP_DOWN_WIDGET: {
    label: "string",
    selectionType: "SINGLE_SELECT | MULTI_SELECT",
    options: "Array<{ label: string, value: string }>",
    defaultOptionValue: "string",
    isRequired: "boolean",
    isVisible: "boolean",
    // onOptionChange: "Function Call",
  },
  FORM_BUTTON_WIDGET: {
    text: "string",
    buttonStyle: "PRIMARY_BUTTON | SECONDARY_BUTTON | DANGER_BUTTON",
    disabledWhenInvalid: "boolean",
    resetFormOnClick: "boolean",
    isVisible: "boolean",
    // onClick: "Function Call",
  },
  MAP_WIDGET: {
    defaultMarkers: "Array<{ lat: number, long: number }>",
    enableSearch: "boolean",
    enablePickLocation: "boolean",
    enableCreateMarker: "boolean",
    isVisible: "boolean",
    // onMarkerClick: "Function Call",
    // onCreateMarker: "Function Call",
  },
  BUTTON_WIDGET: {
    text: "string",
    buttonStyle: "PRIMARY_BUTTON | SECONDARY_BUTTON | DANGER_BUTTON",
    isVisible: "boolean",
    // onClick: "Function Call",
  },
  RICH_TEXT_EDITOR_WIDGET: {
    defaultText: "string",
    isVisible: "boolean",
    isDisabled: "boolean",
    // onTextChange: "Function Call",
  },
  FILE_PICKER_WIDGET: {
    label: "string",
    maxNumFiles: "number",
    maxFileSize: "number",

    allowedFileTypes: "Array<string>",
    isRequired: "boolean",
    isVisible: "boolean",
    uploadedFileUrls: "string",
    // onFilesSelected: "Function Call",
  },
  CHECKBOX_WIDGET: {
    label: "string",
    defaultCheckedState: "boolean",
    isRequired: "boolean",
    isDisabled: "boolean",
    isVisible: "boolean",
    // onCheckChange: "Function Call",
  },
  FORM_WIDGET: {
    backgroundColor: "string",
    isVisible: "boolean",
  },
  TEXT_WIDGET: {
    text: "string",
    textAlign: "LEFT | CENTER | RIGHT",
    textStyle: "HEADING | LABEL | BODY",
    shouldScroll: "boolean",
    isVisible: "boolean",
  },
};

export default FIELD_VALUES;
