import {
  ButtonBorderRadiusTypes,
  ButtonVariantTypes,
} from "components/constants";
import { RenderModes, TextSizes } from "constants/WidgetConstants";
import { remove } from "lodash";
import { getTheme, ThemeMode } from "selectors/themeSelectors";
import { rgbaMigrationConstant } from "./constants";
import {
  borderRadiusUtility,
  boxShadowColorUtility,
  boxShadowDynamicChecker,
  boxShadowUtility,
  escapeSpecialChars,
  fontSizeUtility,
  lightenColor,
  sanitizeKey,
} from "./WidgetUtils";
import {
  getCustomTextColor,
  getCustomBackgroundColor,
  getCustomHoverColor,
} from "./WidgetUtils";

const tableWidgetProps = {
  isVisible: true,
  boxShadow: "none",
  widgetName: "Table1",
  defaultPageSize: 0,
  columnOrder: ["step", "task", "status", "action"],
  isVisibleDownload: true,
  dynamicPropertyPathList: [
    {
      key: "primaryColumns.action.boxShadowColor",
    },
  ],
  displayName: "Table",
  iconSVG: "/static/media/icon.db8a9cbd.svg",
  topRow: 7,
  bottomRow: 35,
  isSortable: true,
  parentRowSpace: 10,
  type: "TABLE_WIDGET",
  defaultSelectedRow: 0,
  hideCard: false,
  animateLoading: true,
  parentColumnSpace: 28.9375,
  dynamicTriggerPathList: [],
  dynamicBindingPathList: [
    {
      key: "primaryColumns.step.computedValue",
    },
    {
      key: "primaryColumns.task.computedValue",
    },
    {
      key: "primaryColumns.status.computedValue",
    },
    {
      key: "primaryColumns.action.computedValue",
    },
    {
      key: "primaryColumns.action.buttonLabel",
    },
    {
      key: "primaryColumns.action.boxShadowColor",
    },
    {
      key: "accentColor",
    },
    {
      key: "selectedRow",
    },
    {
      key: "triggeredRow",
    },
    {
      key: "selectedRows",
    },
    {
      key: "pageSize",
    },
    {
      key: "triggerRowSelection",
    },
    {
      key: "sanitizedTableData",
    },
    {
      key: "tableColumns",
    },
    {
      key: "filteredTableData",
    },
  ],
  leftColumn: 3,
  primaryColumns: {
    step: {
      index: 0,
      width: 150,
      id: "step",
      horizontalAlignment: "LEFT",
      verticalAlignment: "CENTER",
      columnType: "text",
      textSize: "0.875rem",
      enableFilter: true,
      enableSort: true,
      isVisible: true,
      isCellVisible: true,
      isDerived: false,
      label: "step",
      computedValue: ["#1", "#2", "#3"],
      buttonColor: "#03B365",
      menuColor: "#03B365",
      labelColor: "#FFFFFF",
      cellBackground: "",
      textColor: "",
      fontStyle: "",
    },
    task: {
      index: 1,
      width: 150,
      id: "task",
      horizontalAlignment: "LEFT",
      verticalAlignment: "CENTER",
      columnType: "text",
      textSize: "0.875rem",
      enableFilter: true,
      enableSort: true,
      isVisible: true,
      isCellVisible: true,
      isDerived: false,
      label: "task",
      computedValue: [
        "Drop a table",
        "Create a query fetch_users with the Mock DB",
        "Bind the query using => fetch_users.data",
      ],
      buttonColor: "#03B365",
      menuColor: "#03B365",
      labelColor: "#FFFFFF",
      cellBackground: "",
      textColor: "",
      fontStyle: "",
    },
    status: {
      index: 2,
      width: 150,
      id: "status",
      horizontalAlignment: "LEFT",
      verticalAlignment: "CENTER",
      columnType: "text",
      textSize: "0.875rem",
      enableFilter: true,
      enableSort: true,
      isVisible: true,
      isCellVisible: true,
      isDerived: false,
      label: "status",
      computedValue: ["✅", "--", "--"],
      buttonColor: "#03B365",
      menuColor: "#03B365",
      labelColor: "#FFFFFF",
      cellBackground: "",
      textColor: "",
      fontStyle: "",
    },
    action: {
      index: 3,
      width: 150,
      id: "action",
      horizontalAlignment: "LEFT",
      verticalAlignment: "CENTER",
      columnType: "iconButton",
      textSize: "0.875rem",
      enableFilter: true,
      enableSort: true,
      isVisible: true,
      isCellVisible: true,
      isDisabled: false,
      isDerived: false,
      label: "action",
      onClick:
        "{{currentRow.step === '#1' ? showAlert('Done', 'success') : currentRow.step === '#2' ? navigateTo('https://docs.appsmith.com/core-concepts/connecting-to-data-sources/querying-a-database',undefined,'NEW_WINDOW') : navigateTo('https://docs.appsmith.com/core-concepts/displaying-data-read/display-data-tables',undefined,'NEW_WINDOW')}}",
      computedValue: ["", "", ""],
      buttonColor: "#03B365",
      menuColor: "#03B365",
      labelColor: "#FFFFFF",
      buttonLabel: ["Action", "Action", "Action"],
      boxShadow: "0px 0px 4px 3px rgba(0, 0, 0, 0.25)",
      boxShadowColor: ["red", "red", "red"],
      buttonLabelColor: "",
      borderRadius: "",
      buttonVariant: "PRIMARY",
      iconName: "add",
    },
  },
  delimiter: ",",
  derivedColumns: {},
  labelTextSize: "0.875rem",
  rightColumn: 37,
  textSize: "0.875rem",
  widgetId: "z4cs1m6hdc",
  accentColor: "#50AF6C",
  isVisibleFilters: true,
  tableData: [
    {
      step: "#1",
      task: "Drop a table",
      status: "✅",
      action: "",
    },
    {
      step: "#2",
      task: "Create a query fetch_users with the Mock DB",
      status: "--",
      action: "",
    },
    {
      step: "#3",
      task: "Bind the query using => fetch_users.data",
      status: "--",
      action: "",
    },
  ],
  label: "Data",
  searchKey: "",
  enableClientSideSearch: true,
  version: 3,
  totalRecordsCount: 0,
  parentId: "0",
  renderMode: RenderModes.CANVAS,
  isLoading: false,
  horizontalAlignment: "LEFT",
  isVisibleSearch: true,
  childStylesheet: {
    button: {
      buttonColor: "{{appsmith.theme.colors.primaryColor}}",
      borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
      boxShadow: "none",
    },
    menuButton: {
      menuColor: "{{appsmith.theme.colors.primaryColor}}",
      borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
      boxShadow: "none",
    },
    iconButton: {
      menuColor: "{{appsmith.theme.colors.primaryColor}}",
      borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
      boxShadow: "none",
    },
  },
  borderRadius: "0px",
  isVisiblePagination: true,
  verticalAlignment: "CENTER",
  columnSizeMap: {
    task: 245,
    step: 62,
    status: 75,
  },
  defaultSearchText: "",
  pageNo: 1,
  selectedRowIndex: 0,
  selectedRowIndices: 0,
  searchText: "",
  filters: [],
  sortOrder: {
    column: "",
    order: null,
  },
  selectedRow: {
    step: "#1",
    task: "Drop a table",
    status: "✅",
    action: "",
    __originalIndex__: 0,
  },
  triggeredRow: {
    step: "",
    task: "",
    status: "",
    action: "",
  },
  selectedRows: [],
  pageSize: 5,
  triggerRowSelection: false,
  sanitizedTableData: [
    {
      step: "#1",
      task: "Drop a table",
      status: "✅",
      action: "",
    },
    {
      step: "#2",
      task: "Create a query fetch_users with the Mock DB",
      status: "--",
      action: "",
    },
    {
      step: "#3",
      task: "Bind the query using => fetch_users.data",
      status: "--",
      action: "",
    },
  ],
  tableColumns: [
    {
      index: 0,
      width: 150,
      id: "step",
      horizontalAlignment: "LEFT",
      verticalAlignment: "CENTER",
      columnType: "text",
      textSize: "0.875rem",
      enableFilter: true,
      enableSort: true,
      isVisible: true,
      isCellVisible: true,
      isDerived: false,
      label: "step",
      computedValue: ["#1", "#2", "#3"],
      buttonColor: "#03B365",
      menuColor: "#03B365",
      labelColor: "#FFFFFF",
    },
    {
      index: 1,
      width: 150,
      id: "task",
      horizontalAlignment: "LEFT",
      verticalAlignment: "CENTER",
      columnType: "text",
      textSize: "0.875rem",
      enableFilter: true,
      enableSort: true,
      isVisible: true,
      isCellVisible: true,
      isDerived: false,
      label: "task",
      computedValue: [
        "Drop a table",
        "Create a query fetch_users with the Mock DB",
        "Bind the query using => fetch_users.data",
      ],
      buttonColor: "#03B365",
      menuColor: "#03B365",
      labelColor: "#FFFFFF",
    },
    {
      index: 2,
      width: 150,
      id: "status",
      horizontalAlignment: "LEFT",
      verticalAlignment: "CENTER",
      columnType: "text",
      textSize: "0.875rem",
      enableFilter: true,
      enableSort: true,
      isVisible: true,
      isCellVisible: true,
      isDerived: false,
      label: "status",
      computedValue: ["✅", "--", "--"],
      buttonColor: "#03B365",
      menuColor: "#03B365",
      labelColor: "#FFFFFF",
    },
    {
      index: 3,
      width: 150,
      id: "action",
      horizontalAlignment: "LEFT",
      verticalAlignment: "CENTER",
      columnType: "iconButton",
      textSize: "0.875rem",
      enableFilter: true,
      enableSort: true,
      isVisible: true,
      isCellVisible: true,
      isDisabled: false,
      isDerived: false,
      label: "action",
      onClick:
        "{{currentRow.step === '#1' ? showAlert('Done', 'success') : currentRow.step === '#2' ? navigateTo('https://docs.appsmith.com/core-concepts/connecting-to-data-sources/querying-a-database',undefined,'NEW_WINDOW') : navigateTo('https://docs.appsmith.com/core-concepts/displaying-data-read/display-data-tables',undefined,'NEW_WINDOW')}}",
      computedValue: ["", "", ""],
      buttonColor: "#03B365",
      menuColor: "#03B365",
      labelColor: "#FFFFFF",
      buttonLabel: ["Action", "Action", "Action"],
      boxShadow: "0px 0px 4px 3px rgba(0, 0, 0, 0.25)",
      boxShadowColor: ["red", "red", "red"],
    },
  ],
  filteredTableData: [
    {
      step: "#1",
      task: "Drop a table",
      status: "✅",
      action: "",
      __originalIndex__: 0,
    },
    {
      step: "#2",
      task: "Create a query fetch_users with the Mock DB",
      status: "--",
      action: "",
      __originalIndex__: 1,
    },
    {
      step: "#3",
      task: "Bind the query using => fetch_users.data",
      status: "--",
      action: "",
      __originalIndex__: 2,
    },
  ],
  defaultProps: {
    searchText: "defaultSearchText",
    selectedRowIndex: "defaultSelectedRow",
    selectedRowIndices: "defaultSelectedRow",
  },
  defaultMetaProps: [
    "pageNo",
    "selectedRowIndex",
    "selectedRowIndices",
    "searchText",
    "triggeredRowIndex",
    "filters",
    "sortOrder",
  ],
  logBlackList: {
    selectedRow: true,
    triggeredRow: true,
    selectedRows: true,
    pageSize: true,
    triggerRowSelection: true,
    sanitizedTableData: true,
    tableColumns: true,
    filteredTableData: true,
  },
  meta: {
    selectedRowIndex: 0,
    selectedRowIndices: 0,
    searchText: "",
  },
  propertyOverrideDependency: {
    searchText: {
      DEFAULT: "defaultSearchText",
      META: "meta.searchText",
    },
    selectedRowIndex: {
      DEFAULT: "defaultSelectedRow",
      META: "meta.selectedRowIndex",
    },
    selectedRowIndices: {
      DEFAULT: "defaultSelectedRow",
      META: "meta.selectedRowIndices",
    },
  },
  overridingPropertyPaths: {
    defaultSearchText: ["searchText", "meta.searchText"],
    "meta.searchText": ["searchText"],
    defaultSelectedRow: [
      "selectedRowIndex",
      "meta.selectedRowIndex",
      "selectedRowIndices",
      "meta.selectedRowIndices",
    ],
    "meta.selectedRowIndex": ["selectedRowIndex"],
    "meta.selectedRowIndices": ["selectedRowIndices"],
  },
  bindingPaths: {
    selectedRow: "TEMPLATE",
    triggeredRow: "TEMPLATE",
    selectedRows: "TEMPLATE",
    pageSize: "TEMPLATE",
    triggerRowSelection: "TEMPLATE",
    sanitizedTableData: "TEMPLATE",
    tableColumns: "TEMPLATE",
    filteredTableData: "TEMPLATE",
    pageNo: "TEMPLATE",
    selectedRowIndex: "TEMPLATE",
    selectedRowIndices: "TEMPLATE",
    searchText: "TEMPLATE",
    triggeredRowIndex: "TEMPLATE",
    filters: "TEMPLATE",
    sortOrder: "TEMPLATE",
    defaultSearchText: "TEMPLATE",
    "primaryColumns.step.computedValue": "TEMPLATE",
    "primaryColumns.task.computedValue": "TEMPLATE",
    "primaryColumns.status.computedValue": "TEMPLATE",
    "primaryColumns.action.computedValue": "TEMPLATE",
    "primaryColumns.action.buttonLabel": "TEMPLATE",
    "primaryColumns.action.boxShadowColor": "TEMPLATE",
    accentColor: "TEMPLATE",
    "meta.searchText": "TEMPLATE",
    defaultSelectedRow: "TEMPLATE",
    "meta.selectedRowIndex": "TEMPLATE",
    "meta.selectedRowIndices": "TEMPLATE",
    tableData: "SMART_SUBSTITUTE",
    "primaryColumns.action.buttonLabelColor": "TEMPLATE",
    "primaryColumns.action.boxShadow": "TEMPLATE",
    "primaryColumns.action.borderRadius": "TEMPLATE",
    "primaryColumns.action.buttonVariant": "TEMPLATE",
    "primaryColumns.action.buttonColor": "TEMPLATE",
    "primaryColumns.action.iconName": "TEMPLATE",
    "primaryColumns.action.isDisabled": "TEMPLATE",
    "primaryColumns.action.isCellVisible": "TEMPLATE",
    "primaryColumns.status.cellBackground": "TEMPLATE",
    "primaryColumns.status.textColor": "TEMPLATE",
    "primaryColumns.status.verticalAlignment": "TEMPLATE",
    "primaryColumns.status.fontStyle": "TEMPLATE",
    "primaryColumns.status.textSize": "TEMPLATE",
    "primaryColumns.status.horizontalAlignment": "TEMPLATE",
    "primaryColumns.status.isCellVisible": "TEMPLATE",
    "primaryColumns.task.cellBackground": "TEMPLATE",
    "primaryColumns.task.textColor": "TEMPLATE",
    "primaryColumns.task.verticalAlignment": "TEMPLATE",
    "primaryColumns.task.fontStyle": "TEMPLATE",
    "primaryColumns.task.textSize": "TEMPLATE",
    "primaryColumns.task.horizontalAlignment": "TEMPLATE",
    "primaryColumns.task.isCellVisible": "TEMPLATE",
    "primaryColumns.step.cellBackground": "TEMPLATE",
    "primaryColumns.step.textColor": "TEMPLATE",
    "primaryColumns.step.verticalAlignment": "TEMPLATE",
    "primaryColumns.step.fontStyle": "TEMPLATE",
    "primaryColumns.step.textSize": "TEMPLATE",
    "primaryColumns.step.horizontalAlignment": "TEMPLATE",
    "primaryColumns.step.isCellVisible": "TEMPLATE",
    primaryColumnId: "TEMPLATE",
    compactMode: "TEMPLATE",
    isVisible: "TEMPLATE",
    animateLoading: "TEMPLATE",
    isSortable: "TEMPLATE",
    isVisibleSearch: "TEMPLATE",
    isVisibleFilters: "TEMPLATE",
    isVisibleDownload: "TEMPLATE",
    isVisiblePagination: "TEMPLATE",
    delimiter: "TEMPLATE",
    cellBackground: "TEMPLATE",
    textColor: "TEMPLATE",
    textSize: "TEMPLATE",
    borderRadius: "TEMPLATE",
    boxShadow: "TEMPLATE",
  },
  triggerPaths: {
    "primaryColumns.action.onClick": true,
    onRowSelected: true,
    onPageChange: true,
    onPageSizeChange: true,
    onSearchTextChanged: true,
    onSort: true,
  },
  validationPaths: {
    tableData: {
      type: "OBJECT_ARRAY",
      params: {
        default: [],
      },
    },
    "primaryColumns.action.buttonLabelColor": {
      type: "TABLE_PROPERTY",
      params: {
        type: "TEXT",
        params: {
          regex: {},
        },
      },
    },
    "primaryColumns.action.boxShadow": {
      type: "TABLE_PROPERTY",
      params: {
        type: "TEXT",
      },
    },
    "primaryColumns.action.borderRadius": {
      type: "TABLE_PROPERTY",
      params: {
        type: "TEXT",
      },
    },
    "primaryColumns.action.buttonVariant": {
      type: "TABLE_PROPERTY",
      params: {
        type: "TEXT",
        params: {
          default: "PRIMARY",
          allowedValues: ["PRIMARY", "SECONDARY", "TERTIARY"],
        },
      },
    },
    "primaryColumns.action.buttonColor": {
      type: "TABLE_PROPERTY",
      params: {
        type: "TEXT",
        params: {
          regex: {},
        },
      },
    },
    "primaryColumns.action.iconName": {
      type: "TABLE_PROPERTY",
      params: {
        type: "TEXT",
        params: {
          allowedValues: [
            "add",
            "add-column-left",
            "add-column-right",
            "add-row-bottom",
            "add-row-top",
            "add-to-artifact",
            "add-to-folder",
            "airplane",
            "align-center",
            "align-justify",
            "align-left",
            "align-right",
            "alignment-bottom",
            "alignment-horizontal-center",
            "alignment-left",
            "alignment-right",
            "alignment-top",
            "alignment-vertical-center",
            "annotation",
            "app-header",
            "application",
            "applications",
            "archive",
            "array",
            "array-boolean",
            "array-date",
            "array-numeric",
            "array-string",
            "array-timestamp",
            "arrow-bottom-left",
            "arrow-bottom-right",
            "arrow-down",
            "arrow-left",
            "arrow-right",
            "arrow-top-left",
            "arrow-top-right",
            "arrow-up",
            "arrows-horizontal",
            "arrows-vertical",
            "asterisk",
            "automatic-updates",
            "backlink",
            "badge",
            "ban-circle",
            "bank-account",
            "barcode",
            "blank",
            "blocked-person",
            "bold",
            "book",
            "bookmark",
            "box",
            "briefcase",
            "bring-data",
            "build",
            "calculator",
            "calendar",
            "camera",
            "caret-down",
            "caret-left",
            "caret-right",
            "caret-up",
            "cell-tower",
            "changes",
            "chart",
            "chat",
            "chevron-backward",
            "chevron-down",
            "chevron-forward",
            "chevron-left",
            "chevron-right",
            "chevron-up",
            "circle",
            "circle-arrow-down",
            "circle-arrow-left",
            "circle-arrow-right",
            "circle-arrow-up",
            "citation",
            "clean",
            "clipboard",
            "cloud",
            "cloud-download",
            "cloud-upload",
            "code",
            "code-block",
            "cog",
            "collapse-all",
            "column-layout",
            "comment",
            "comparison",
            "compass",
            "compressed",
            "confirm",
            "console",
            "contrast",
            "control",
            "credit-card",
            "cross",
            "crown",
            "cube",
            "cube-add",
            "cube-remove",
            "curved-range-chart",
            "cut",
            "cycle",
            "dashboard",
            "data-connection",
            "data-lineage",
            "database",
            "delete",
            "delta",
            "derive-column",
            "desktop",
            "diagnosis",
            "diagram-tree",
            "direction-left",
            "direction-right",
            "disable",
            "document",
            "document-open",
            "document-share",
            "dollar",
            "dot",
            "double-caret-horizontal",
            "double-caret-vertical",
            "double-chevron-down",
            "double-chevron-left",
            "double-chevron-right",
            "double-chevron-up",
            "doughnut-chart",
            "download",
            "drag-handle-horizontal",
            "drag-handle-vertical",
            "draw",
            "drawer-left",
            "drawer-left-filled",
            "drawer-right",
            "drawer-right-filled",
            "drive-time",
            "duplicate",
            "edit",
            "eject",
            "endorsed",
            "envelope",
            "equals",
            "eraser",
            "error",
            "euro",
            "exchange",
            "exclude-row",
            "expand-all",
            "export",
            "eye-off",
            "eye-on",
            "eye-open",
            "fast-backward",
            "fast-forward",
            "feed",
            "feed-subscribed",
            "film",
            "filter",
            "filter-keep",
            "filter-list",
            "filter-open",
            "filter-remove",
            "flag",
            "flame",
            "flash",
            "floppy-disk",
            "flow-branch",
            "flow-end",
            "flow-linear",
            "flow-review",
            "flow-review-branch",
            "flows",
            "folder-close",
            "folder-new",
            "folder-open",
            "folder-shared",
            "folder-shared-open",
            "follower",
            "following",
            "font",
            "fork",
            "form",
            "full-circle",
            "full-stacked-chart",
            "fullscreen",
            "function",
            "gantt-chart",
            "geofence",
            "geolocation",
            "geosearch",
            "git-branch",
            "git-commit",
            "git-merge",
            "git-new-branch",
            "git-pull",
            "git-push",
            "git-repo",
            "glass",
            "globe",
            "globe-network",
            "graph",
            "graph-remove",
            "greater-than",
            "greater-than-or-equal-to",
            "grid",
            "grid-view",
            "group-objects",
            "grouped-bar-chart",
            "hand",
            "hand-down",
            "hand-left",
            "hand-right",
            "hand-up",
            "hat",
            "header",
            "header-one",
            "header-two",
            "headset",
            "heart",
            "heart-broken",
            "heat-grid",
            "heatmap",
            "help",
            "helper-management",
            "highlight",
            "history",
            "home",
            "horizontal-bar-chart",
            "horizontal-bar-chart-asc",
            "horizontal-bar-chart-desc",
            "horizontal-distribution",
            "id-number",
            "image-rotate-left",
            "image-rotate-right",
            "import",
            "inbox",
            "inbox-filtered",
            "inbox-geo",
            "inbox-search",
            "inbox-update",
            "info-sign",
            "inheritance",
            "inherited-group",
            "inner-join",
            "insert",
            "intersection",
            "ip-address",
            "issue",
            "issue-closed",
            "issue-new",
            "italic",
            "join-table",
            "key",
            "key-backspace",
            "key-command",
            "key-control",
            "key-delete",
            "key-enter",
            "key-escape",
            "key-option",
            "key-shift",
            "key-tab",
            "known-vehicle",
            "lab-test",
            "label",
            "layer",
            "layers",
            "layout",
            "layout-auto",
            "layout-balloon",
            "layout-circle",
            "layout-grid",
            "layout-group-by",
            "layout-hierarchy",
            "layout-linear",
            "layout-skew-grid",
            "layout-sorted-clusters",
            "learning",
            "left-join",
            "less-than",
            "less-than-or-equal-to",
            "lifesaver",
            "lightbulb",
            "link",
            "list",
            "list-columns",
            "list-detail-view",
            "locate",
            "lock",
            "log-in",
            "log-out",
            "manual",
            "manually-entered-data",
            "map",
            "map-create",
            "map-marker",
            "maximize",
            "media",
            "menu",
            "menu-closed",
            "menu-open",
            "merge-columns",
            "merge-links",
            "minimize",
            "minus",
            "mobile-phone",
            "mobile-video",
            "modal",
            "modal-filled",
            "moon",
            "more",
            "mountain",
            "move",
            "mugshot",
            "multi-select",
            "music",
            "new-drawing",
            "new-grid-item",
            "new-layer",
            "new-layers",
            "new-link",
            "new-object",
            "new-person",
            "new-prescription",
            "new-text-box",
            "ninja",
            "not-equal-to",
            "notifications",
            "notifications-updated",
            "numbered-list",
            "numerical",
            "office",
            "offline",
            "oil-field",
            "one-column",
            "outdated",
            "page-layout",
            "panel-stats",
            "panel-table",
            "paperclip",
            "paragraph",
            "path",
            "path-search",
            "pause",
            "people",
            "percentage",
            "person",
            "phone",
            "pie-chart",
            "pin",
            "pivot",
            "pivot-table",
            "play",
            "plus",
            "polygon-filter",
            "power",
            "predictive-analysis",
            "prescription",
            "presentation",
            "print",
            "projects",
            "properties",
            "property",
            "publish-function",
            "pulse",
            "random",
            "record",
            "redo",
            "refresh",
            "regression-chart",
            "remove",
            "remove-column",
            "remove-column-left",
            "remove-column-right",
            "remove-row-bottom",
            "remove-row-top",
            "repeat",
            "reset",
            "resolve",
            "rig",
            "right-join",
            "ring",
            "rotate-document",
            "rotate-page",
            "route",
            "satellite",
            "saved",
            "scatter-plot",
            "search",
            "search-around",
            "search-template",
            "search-text",
            "segmented-control",
            "select",
            "selection",
            "send-message",
            "send-to",
            "send-to-graph",
            "send-to-map",
            "series-add",
            "series-configuration",
            "series-derived",
            "series-filtered",
            "series-search",
            "settings",
            "share",
            "shield",
            "shop",
            "shopping-cart",
            "signal-search",
            "sim-card",
            "slash",
            "small-cross",
            "small-minus",
            "small-plus",
            "small-tick",
            "snowflake",
            "social-media",
            "sort",
            "sort-alphabetical",
            "sort-alphabetical-desc",
            "sort-asc",
            "sort-desc",
            "sort-numerical",
            "sort-numerical-desc",
            "split-columns",
            "square",
            "stacked-chart",
            "star",
            "star-empty",
            "step-backward",
            "step-chart",
            "step-forward",
            "stop",
            "stopwatch",
            "strikethrough",
            "style",
            "swap-horizontal",
            "swap-vertical",
            "switch",
            "symbol-circle",
            "symbol-cross",
            "symbol-diamond",
            "symbol-square",
            "symbol-triangle-down",
            "symbol-triangle-up",
            "tag",
            "take-action",
            "taxi",
            "text-highlight",
            "th",
            "th-derived",
            "th-disconnect",
            "th-filtered",
            "th-list",
            "thumbs-down",
            "thumbs-up",
            "tick",
            "tick-circle",
            "time",
            "timeline-area-chart",
            "timeline-bar-chart",
            "timeline-events",
            "timeline-line-chart",
            "tint",
            "torch",
            "tractor",
            "train",
            "translate",
            "trash",
            "tree",
            "trending-down",
            "trending-up",
            "truck",
            "two-columns",
            "unarchive",
            "underline",
            "undo",
            "ungroup-objects",
            "unknown-vehicle",
            "unlock",
            "unpin",
            "unresolve",
            "updated",
            "upload",
            "user",
            "variable",
            "vertical-bar-chart-asc",
            "vertical-bar-chart-desc",
            "vertical-distribution",
            "video",
            "virus",
            "volume-down",
            "volume-off",
            "volume-up",
            "walk",
            "warning-sign",
            "waterfall-chart",
            "widget",
            "widget-button",
            "widget-footer",
            "widget-header",
            "wrench",
            "zoom-in",
            "zoom-out",
            "zoom-to-fit",
          ],
          default: "add",
        },
      },
    },
    "primaryColumns.action.isDisabled": {
      type: "TABLE_PROPERTY",
      params: {
        type: "BOOLEAN",
      },
    },
    "primaryColumns.action.isCellVisible": {
      type: "TABLE_PROPERTY",
      params: {
        type: "BOOLEAN",
      },
    },
    "primaryColumns.status.cellBackground": {
      type: "TABLE_PROPERTY",
      params: {
        type: "TEXT",
        params: {
          regex: {},
        },
      },
    },
    "primaryColumns.status.textColor": {
      type: "TABLE_PROPERTY",
      params: {
        type: "TEXT",
        params: {
          regex: {},
        },
      },
    },
    "primaryColumns.status.verticalAlignment": {
      type: "TABLE_PROPERTY",
      params: {
        type: "TEXT",
        params: {
          allowedValues: ["TOP", "CENTER", "BOTTOM"],
        },
      },
    },
    "primaryColumns.status.fontStyle": {
      type: "TABLE_PROPERTY",
      params: {
        type: "TEXT",
      },
    },
    "primaryColumns.status.textSize": {
      type: "TABLE_PROPERTY",
      params: {
        type: "TEXT",
      },
    },
    "primaryColumns.status.horizontalAlignment": {
      type: "TABLE_PROPERTY",
      params: {
        type: "TEXT",
        params: {
          allowedValues: ["LEFT", "CENTER", "RIGHT"],
        },
      },
    },
    "primaryColumns.status.isCellVisible": {
      type: "TABLE_PROPERTY",
      params: {
        type: "BOOLEAN",
      },
    },
    "primaryColumns.task.cellBackground": {
      type: "TABLE_PROPERTY",
      params: {
        type: "TEXT",
        params: {
          regex: {},
        },
      },
    },
    "primaryColumns.task.textColor": {
      type: "TABLE_PROPERTY",
      params: {
        type: "TEXT",
        params: {
          regex: {},
        },
      },
    },
    "primaryColumns.task.verticalAlignment": {
      type: "TABLE_PROPERTY",
      params: {
        type: "TEXT",
        params: {
          allowedValues: ["TOP", "CENTER", "BOTTOM"],
        },
      },
    },
    "primaryColumns.task.fontStyle": {
      type: "TABLE_PROPERTY",
      params: {
        type: "TEXT",
      },
    },
    "primaryColumns.task.textSize": {
      type: "TABLE_PROPERTY",
      params: {
        type: "TEXT",
      },
    },
    "primaryColumns.task.horizontalAlignment": {
      type: "TABLE_PROPERTY",
      params: {
        type: "TEXT",
        params: {
          allowedValues: ["LEFT", "CENTER", "RIGHT"],
        },
      },
    },
    "primaryColumns.task.isCellVisible": {
      type: "TABLE_PROPERTY",
      params: {
        type: "BOOLEAN",
      },
    },
    "primaryColumns.step.cellBackground": {
      type: "TABLE_PROPERTY",
      params: {
        type: "TEXT",
        params: {
          regex: {},
        },
      },
    },
    "primaryColumns.step.textColor": {
      type: "TABLE_PROPERTY",
      params: {
        type: "TEXT",
        params: {
          regex: {},
        },
      },
    },
    "primaryColumns.step.verticalAlignment": {
      type: "TABLE_PROPERTY",
      params: {
        type: "TEXT",
        params: {
          allowedValues: ["TOP", "CENTER", "BOTTOM"],
        },
      },
    },
    "primaryColumns.step.fontStyle": {
      type: "TABLE_PROPERTY",
      params: {
        type: "TEXT",
      },
    },
    "primaryColumns.step.textSize": {
      type: "TABLE_PROPERTY",
      params: {
        type: "TEXT",
      },
    },
    "primaryColumns.step.horizontalAlignment": {
      type: "TABLE_PROPERTY",
      params: {
        type: "TEXT",
        params: {
          allowedValues: ["LEFT", "CENTER", "RIGHT"],
        },
      },
    },
    "primaryColumns.step.isCellVisible": {
      type: "TABLE_PROPERTY",
      params: {
        type: "BOOLEAN",
      },
    },
    primaryColumnId: {
      type: "TEXT",
    },
    defaultSearchText: {
      type: "TEXT",
    },
    defaultSelectedRow: {
      type: "FUNCTION",
      params: {
        expected: {
          type: "Index of row(s)",
          example: "0 | [0, 1]",
          autocompleteDataType: "STRING",
        },
        fnString:
          'function defaultSelectedRowValidation(value, props, _) {\n  if (props) {\n    if (props.multiRowSelection) {\n      if (_.isString(value)) {\n        var trimmed = value.trim();\n\n        try {\n          var parsedArray = JSON.parse(trimmed);\n\n          if (Array.isArray(parsedArray)) {\n            var sanitized = parsedArray.filter(entry => {\n              return Number.isInteger(parseInt(entry, 10)) && parseInt(entry, 10) > -1;\n            });\n            return {\n              isValid: true,\n              parsed: sanitized\n            };\n          } else {\n            throw Error("Not a stringified array");\n          }\n        } catch (e) {\n          // If cannot be parsed as an array\n          var arrayEntries = trimmed.split(",");\n          var result = [];\n          arrayEntries.forEach(entry => {\n            if (Number.isInteger(parseInt(entry, 10)) && parseInt(entry, 10) > -1) {\n              if (!_.isNil(entry)) result.push(parseInt(entry, 10));\n            }\n          });\n          return {\n            isValid: true,\n            parsed: result\n          };\n        }\n      }\n\n      if (Array.isArray(value)) {\n        var _sanitized = value.filter(entry => {\n          return Number.isInteger(parseInt(entry, 10)) && parseInt(entry, 10) > -1;\n        });\n\n        return {\n          isValid: true,\n          parsed: _sanitized\n        };\n      }\n\n      if (Number.isInteger(value) && value > -1) {\n        return {\n          isValid: true,\n          parsed: [value]\n        };\n      }\n\n      return {\n        isValid: false,\n        parsed: [],\n        message: "This value does not match type: number[]"\n      };\n    } else {\n      try {\n        var _value = value;\n\n        if (_value === "") {\n          return {\n            isValid: true,\n            parsed: undefined\n          };\n        }\n\n        if (Number.isInteger(parseInt(_value, 10)) && parseInt(_value, 10) > -1) return {\n          isValid: true,\n          parsed: parseInt(_value, 10)\n        };\n        return {\n          isValid: true,\n          parsed: -1\n        };\n      } catch (e) {\n        return {\n          isValid: true,\n          parsed: -1\n        };\n      }\n    }\n  }\n\n  return {\n    isValid: true,\n    parsed: value\n  };\n}',
      },
    },
    isVisible: {
      type: "BOOLEAN",
    },
    animateLoading: {
      type: "BOOLEAN",
    },
    isSortable: {
      type: "BOOLEAN",
      params: {
        default: true,
      },
    },
    isVisibleSearch: {
      type: "BOOLEAN",
    },
    isVisibleFilters: {
      type: "BOOLEAN",
    },
    isVisibleDownload: {
      type: "BOOLEAN",
    },
    isVisiblePagination: {
      type: "BOOLEAN",
    },
    delimiter: {
      type: "TEXT",
    },
    cellBackground: {
      type: "TEXT",
    },
    textColor: {
      type: "TEXT",
    },
    textSize: {
      type: "TEXT",
    },
    borderRadius: {
      type: "TEXT",
    },
    boxShadow: {
      type: "TEXT",
    },
  },
  ENTITY_TYPE: "WIDGET",
  privateWidgets: {},
  __evaluation__: {
    errors: {
      tableData: [],
      sanitizedTableData: [],
      "primaryColumns.action.boxShadowColor": [
        {
          errorType: "LINT",
          raw:
            '\n  function closedFunction () {\n    const result = Table1.sanitizedTableData.map((currentRow) => ( "red"))\n    return result;\n  }\n  closedFunction.call(THIS_CONTEXT)\n  ',
          severity: "warning",
          errorMessage: "'currentRow' is defined but never used.",
          errorSegment:
            '    const result = Table1.sanitizedTableData.map((currentRow) => ( "red"))',
          originalBinding:
            'Table1.sanitizedTableData.map((currentRow) => ( "red"))',
          variables: ["currentRow", null, null, null],
          code: "W098",
          line: 0,
          ch: 32,
        },
      ],
      "primaryColumns.action.buttonLabel": [
        {
          errorType: "LINT",
          raw:
            "\n  function closedFunction () {\n    const result = Table1.sanitizedTableData.map((currentRow) => ( 'Action'))\n    return result;\n  }\n  closedFunction.call(THIS_CONTEXT)\n  ",
          severity: "warning",
          errorMessage: "'currentRow' is defined but never used.",
          errorSegment:
            "    const result = Table1.sanitizedTableData.map((currentRow) => ( 'Action'))",
          originalBinding:
            "Table1.sanitizedTableData.map((currentRow) => ( 'Action'))",
          variables: ["currentRow", null, null, null],
          code: "W098",
          line: 0,
          ch: 32,
        },
      ],
      "primaryColumns.action.computedValue": [],
      "primaryColumns.action": [],
      "primaryColumns.status.computedValue": [],
      "primaryColumns.status": [],
      "primaryColumns.task.computedValue": [],
      "primaryColumns.task": [],
      "primaryColumns.step.computedValue": [],
      "primaryColumns.step": [],
      "sortOrder.order": [],
      "sortOrder.column": [],
      sortOrder: [],
      "meta.selectedRowIndices": [],
      "meta.selectedRowIndex": [],
      "meta.searchText": [],
      meta: [],
      filters: [],
      enableClientSideSearch: [],
      derivedColumns: [],
      columnOrder: [],
      primaryColumns: [],
      tableColumns: [],
      triggerRowSelection: [],
      parentRowSpace: [],
      topRow: [],
      bottomRow: [],
      pageSize: [],
      defaultSearchText: [],
      searchText: [],
      filteredTableData: [],
      defaultSelectedRow: [],
      selectedRowIndices: [],
      selectedRows: [],
      triggeredRowIndex: [],
      triggeredRow: [],
      selectedRowIndex: [],
      selectedRow: [],
      accentColor: [],
    },
    evaluatedValues: {
      tableData: [
        {
          step: "#1",
          task: "Drop a table",
          status: "✅",
          action: "",
        },
        {
          step: "#2",
          task: "Create a query fetch_users with the Mock DB",
          status: "--",
          action: "",
        },
        {
          step: "#3",
          task: "Bind the query using => fetch_users.data",
          status: "--",
          action: "",
        },
      ],
      sanitizedTableData: [
        {
          step: "#1",
          task: "Drop a table",
          status: "✅",
          action: "",
        },
        {
          step: "#2",
          task: "Create a query fetch_users with the Mock DB",
          status: "--",
          action: "",
        },
        {
          step: "#3",
          task: "Bind the query using => fetch_users.data",
          status: "--",
          action: "",
        },
      ],
      "primaryColumns.action.boxShadowColor": ["red", "red", "red"],
      "primaryColumns.action.buttonLabel": ["Action", "Action", "Action"],
      "primaryColumns.action.computedValue": ["", "", ""],
      "primaryColumns.action": {
        index: 3,
        width: 150,
        id: "action",
        horizontalAlignment: "LEFT",
        verticalAlignment: "CENTER",
        columnType: "iconButton",
        textSize: "0.875rem",
        enableFilter: true,
        enableSort: true,
        isVisible: true,
        isCellVisible: true,
        isDisabled: false,
        isDerived: false,
        label: "action",
        onClick:
          "{{currentRow.step === '#1' ? showAlert('Done', 'success') : currentRow.step === '#2' ? navigateTo('https://docs.appsmith.com/core-concepts/connecting-to-data-sources/querying-a-database',undefined,'NEW_WINDOW') : navigateTo('https://docs.appsmith.com/core-concepts/displaying-data-read/display-data-tables',undefined,'NEW_WINDOW')}}",
        computedValue: ["", "", ""],
        buttonColor: "#03B365",
        menuColor: "#03B365",
        labelColor: "#FFFFFF",
        buttonLabel: ["Action", "Action", "Action"],
        boxShadow: "0px 0px 4px 3px rgba(0, 0, 0, 0.25)",
        boxShadowColor: ["red", "red", "red"],
      },
      "primaryColumns.status.computedValue": ["✅", "--", "--"],
      "primaryColumns.status": {
        index: 2,
        width: 150,
        id: "status",
        horizontalAlignment: "LEFT",
        verticalAlignment: "CENTER",
        columnType: "text",
        textSize: "0.875rem",
        enableFilter: true,
        enableSort: true,
        isVisible: true,
        isCellVisible: true,
        isDerived: false,
        label: "status",
        computedValue: ["✅", "--", "--"],
        buttonColor: "#03B365",
        menuColor: "#03B365",
        labelColor: "#FFFFFF",
      },
      "primaryColumns.task.computedValue": [
        "Drop a table",
        "Create a query fetch_users with the Mock DB",
        "Bind the query using => fetch_users.data",
      ],
      "primaryColumns.task": {
        index: 1,
        width: 150,
        id: "task",
        horizontalAlignment: "LEFT",
        verticalAlignment: "CENTER",
        columnType: "text",
        textSize: "0.875rem",
        enableFilter: true,
        enableSort: true,
        isVisible: true,
        isCellVisible: true,
        isDerived: false,
        label: "task",
        computedValue: [
          "Drop a table",
          "Create a query fetch_users with the Mock DB",
          "Bind the query using => fetch_users.data",
        ],
        buttonColor: "#03B365",
        menuColor: "#03B365",
        labelColor: "#FFFFFF",
      },
      "primaryColumns.step.computedValue": ["#1", "#2", "#3"],
      "primaryColumns.step": {
        index: 0,
        width: 150,
        id: "step",
        horizontalAlignment: "LEFT",
        verticalAlignment: "CENTER",
        columnType: "text",
        textSize: "0.875rem",
        enableFilter: true,
        enableSort: true,
        isVisible: true,
        isCellVisible: true,
        isDerived: false,
        label: "step",
        computedValue: ["#1", "#2", "#3"],
        buttonColor: "#03B365",
        menuColor: "#03B365",
        labelColor: "#FFFFFF",
      },
      "sortOrder.order": null,
      "sortOrder.column": "",
      sortOrder: {
        column: "",
        order: null,
      },
      meta: {},
      filters: [],
      enableClientSideSearch: true,
      derivedColumns: {},
      columnOrder: ["step", "task", "status", "action"],
      primaryColumns: {
        step: {
          index: 0,
          width: 150,
          id: "step",
          horizontalAlignment: "LEFT",
          verticalAlignment: "CENTER",
          columnType: "text",
          textSize: "0.875rem",
          enableFilter: true,
          enableSort: true,
          isVisible: true,
          isCellVisible: true,
          isDerived: false,
          label: "step",
          computedValue: ["#1", "#2", "#3"],
          buttonColor: "#03B365",
          menuColor: "#03B365",
          labelColor: "#FFFFFF",
        },
        task: {
          index: 1,
          width: 150,
          id: "task",
          horizontalAlignment: "LEFT",
          verticalAlignment: "CENTER",
          columnType: "text",
          textSize: "0.875rem",
          enableFilter: true,
          enableSort: true,
          isVisible: true,
          isCellVisible: true,
          isDerived: false,
          label: "task",
          computedValue: [
            "Drop a table",
            "Create a query fetch_users with the Mock DB",
            "Bind the query using => fetch_users.data",
          ],
          buttonColor: "#03B365",
          menuColor: "#03B365",
          labelColor: "#FFFFFF",
        },
        status: {
          index: 2,
          width: 150,
          id: "status",
          horizontalAlignment: "LEFT",
          verticalAlignment: "CENTER",
          columnType: "text",
          textSize: "0.875rem",
          enableFilter: true,
          enableSort: true,
          isVisible: true,
          isCellVisible: true,
          isDerived: false,
          label: "status",
          computedValue: ["✅", "--", "--"],
          buttonColor: "#03B365",
          menuColor: "#03B365",
          labelColor: "#FFFFFF",
        },
        action: {
          index: 3,
          width: 150,
          id: "action",
          horizontalAlignment: "LEFT",
          verticalAlignment: "CENTER",
          columnType: "iconButton",
          textSize: "0.875rem",
          enableFilter: true,
          enableSort: true,
          isVisible: true,
          isCellVisible: true,
          isDisabled: false,
          isDerived: false,
          label: "action",
          onClick:
            "{{currentRow.step === '#1' ? showAlert('Done', 'success') : currentRow.step === '#2' ? navigateTo('https://docs.appsmith.com/core-concepts/connecting-to-data-sources/querying-a-database',undefined,'NEW_WINDOW') : navigateTo('https://docs.appsmith.com/core-concepts/displaying-data-read/display-data-tables',undefined,'NEW_WINDOW')}}",
          computedValue: ["", "", ""],
          buttonColor: "#03B365",
          menuColor: "#03B365",
          labelColor: "#FFFFFF",
          buttonLabel: ["Action", "Action", "Action"],
          boxShadow: "0px 0px 4px 3px rgba(0, 0, 0, 0.25)",
          boxShadowColor: ["red", "red", "red"],
        },
      },
      tableColumns: [
        {
          index: 0,
          width: 150,
          id: "step",
          horizontalAlignment: "LEFT",
          verticalAlignment: "CENTER",
          columnType: "text",
          textSize: "0.875rem",
          enableFilter: true,
          enableSort: true,
          isVisible: true,
          isCellVisible: true,
          isDerived: false,
          label: "step",
          computedValue: ["#1", "#2", "#3"],
          buttonColor: "#03B365",
          menuColor: "#03B365",
          labelColor: "#FFFFFF",
        },
        {
          index: 1,
          width: 150,
          id: "task",
          horizontalAlignment: "LEFT",
          verticalAlignment: "CENTER",
          columnType: "text",
          textSize: "0.875rem",
          enableFilter: true,
          enableSort: true,
          isVisible: true,
          isCellVisible: true,
          isDerived: false,
          label: "task",
          computedValue: [
            "Drop a table",
            "Create a query fetch_users with the Mock DB",
            "Bind the query using => fetch_users.data",
          ],
          buttonColor: "#03B365",
          menuColor: "#03B365",
          labelColor: "#FFFFFF",
        },
        {
          index: 2,
          width: 150,
          id: "status",
          horizontalAlignment: "LEFT",
          verticalAlignment: "CENTER",
          columnType: "text",
          textSize: "0.875rem",
          enableFilter: true,
          enableSort: true,
          isVisible: true,
          isCellVisible: true,
          isDerived: false,
          label: "status",
          computedValue: ["✅", "--", "--"],
          buttonColor: "#03B365",
          menuColor: "#03B365",
          labelColor: "#FFFFFF",
        },
        {
          index: 3,
          width: 150,
          id: "action",
          horizontalAlignment: "LEFT",
          verticalAlignment: "CENTER",
          columnType: "iconButton",
          textSize: "0.875rem",
          enableFilter: true,
          enableSort: true,
          isVisible: true,
          isCellVisible: true,
          isDisabled: false,
          isDerived: false,
          label: "action",
          onClick:
            "{{currentRow.step === '#1' ? showAlert('Done', 'success') : currentRow.step === '#2' ? navigateTo('https://docs.appsmith.com/core-concepts/connecting-to-data-sources/querying-a-database',undefined,'NEW_WINDOW') : navigateTo('https://docs.appsmith.com/core-concepts/displaying-data-read/display-data-tables',undefined,'NEW_WINDOW')}}",
          computedValue: ["", "", ""],
          buttonColor: "#03B365",
          menuColor: "#03B365",
          labelColor: "#FFFFFF",
          buttonLabel: ["Action", "Action", "Action"],
          boxShadow: "0px 0px 4px 3px rgba(0, 0, 0, 0.25)",
          boxShadowColor: ["red", "red", "red"],
        },
      ],
      triggerRowSelection: false,
      parentRowSpace: 10,
      topRow: 7,
      bottomRow: 35,
      pageSize: 5,
      defaultSearchText: "",
      searchText: "",
      filteredTableData: [
        {
          step: "#1",
          task: "Drop a table",
          status: "✅",
          action: "",
          __originalIndex__: 0,
        },
        {
          step: "#2",
          task: "Create a query fetch_users with the Mock DB",
          status: "--",
          action: "",
          __originalIndex__: 1,
        },
        {
          step: "#3",
          task: "Bind the query using => fetch_users.data",
          status: "--",
          action: "",
          __originalIndex__: 2,
        },
      ],
      defaultSelectedRow: 0,
      selectedRowIndices: 0,
      selectedRows: [],
      triggeredRow: {
        step: "",
        task: "",
        status: "",
        action: "",
      },
      selectedRowIndex: 0,
      selectedRow: {
        step: "#1",
        task: "Drop a table",
        status: "✅",
        action: "",
        __originalIndex__: 0,
      },
      accentColor: "#50AF6C",
      "primaryColumns.action.buttonLabelColor": "",
      "primaryColumns.action.boxShadow": "0px 0px 4px 3px rgba(0, 0, 0, 0.25)",
      "primaryColumns.action.borderRadius": "",
      "primaryColumns.action.buttonVariant": "PRIMARY",
      "primaryColumns.action.buttonColor": "#03B365",
      "primaryColumns.action.iconName": "add",
      "primaryColumns.action.isDisabled": false,
      "primaryColumns.action.isCellVisible": true,
      "primaryColumns.status.cellBackground": "",
      "primaryColumns.status.textColor": "",
      "primaryColumns.status.verticalAlignment": "CENTER",
      "primaryColumns.status.fontStyle": "",
      "primaryColumns.status.textSize": "0.875rem",
      "primaryColumns.status.horizontalAlignment": "LEFT",
      "primaryColumns.status.isCellVisible": true,
      "primaryColumns.task.cellBackground": "",
      "primaryColumns.task.textColor": "",
      "primaryColumns.task.verticalAlignment": "CENTER",
      "primaryColumns.task.fontStyle": "",
      "primaryColumns.task.textSize": "0.875rem",
      "primaryColumns.task.horizontalAlignment": "LEFT",
      "primaryColumns.task.isCellVisible": true,
      "primaryColumns.step.cellBackground": "",
      "primaryColumns.step.textColor": "",
      "primaryColumns.step.verticalAlignment": "CENTER",
      "primaryColumns.step.fontStyle": "",
      "primaryColumns.step.textSize": "0.875rem",
      "primaryColumns.step.horizontalAlignment": "LEFT",
      "primaryColumns.step.isCellVisible": true,
      primaryColumnId: "",
      isVisible: true,
      animateLoading: true,
      isSortable: true,
      isVisibleSearch: true,
      isVisibleFilters: true,
      isVisibleDownload: true,
      isVisiblePagination: true,
      delimiter: ",",
      cellBackground: "",
      textColor: "",
      textSize: "0.875rem",
      borderRadius: "0px",
      boxShadow: "none",
    },
  },
  primaryColumnId: "",
  cellBackground: "",
  textColor: "",
  dragDisabled: false,
  dropDisabled: false,
  isDeletable: true,
  resizeDisabled: false,
  disablePropertyPane: false,
};

describe("validate widget utils button style functions", () => {
  const theme = getTheme(ThemeMode.LIGHT);
  // validate getCustomTextColor function
  it("getCustomTextColor - validate empty or undefined background color", () => {
    // background color is undefined
    const result = getCustomTextColor(theme);
    expect(result).toStrictEqual("#FFFFFF");

    // background color is empty string
    const backgroundColor = "";
    const expected = "#FFFFFF";
    const result2 = getCustomTextColor(theme, backgroundColor);
    expect(result2).toStrictEqual(expected);
  });

  it("getCustomTextColor - validate text color in case of dark or light background color", () => {
    // background color is dark
    const blueBackground = "#3366FF";
    const expected1 = "#FFFFFF";
    const result1 = getCustomTextColor(theme, blueBackground);
    expect(result1).toStrictEqual(expected1);

    // background color is light
    const yellowBackground = "#FFC13D";
    const expected2 = "#FFFFFF";
    const result2 = getCustomTextColor(theme, yellowBackground);

    expect(result2).toStrictEqual(expected2);
  });

  // validate getCustomBackgroundColor function
  it("getCustomBackgroundColor - validate empty or undefined background color", () => {
    const expected = "none";
    const result = getCustomBackgroundColor();
    expect(result).toStrictEqual(expected);
  });

  it("getCustomBackgroundColor - validate background color with primary button variant", () => {
    const backgroundColor = "#03b365";
    const expected = "#03b365";
    const result = getCustomBackgroundColor(
      ButtonVariantTypes.PRIMARY,
      backgroundColor,
    );
    expect(result).toStrictEqual(expected);
  });

  it("getCustomBackgroundColor - validate background color with secondary button variant", () => {
    const backgroundColor = "#03b365";
    const expected = "none";
    const result = getCustomBackgroundColor(
      ButtonVariantTypes.SECONDARY,
      backgroundColor,
    );
    expect(result).toStrictEqual(expected);
  });

  // validate getCustomHoverColor function
  it("getCustomHoverColor - validate empty or undefined background color or variant", () => {
    // background color and variant is both are undefined
    const expected = "#00693B";
    const result = getCustomHoverColor(theme);
    expect(result).toStrictEqual(expected);

    // variant is undefined
    const backgroundColor = "#03b365";
    const expected1 = "#028149";
    const result1 = getCustomHoverColor(theme, undefined, backgroundColor);
    expect(result1).toStrictEqual(expected1);
  });

  // validate getCustomHoverColor function
  it("getCustomHoverColor - validate hover color for different variant", () => {
    const backgroundColor = "#03b365";
    // variant : PRIMARY
    const expected1 = "#028149";
    const result1 = getCustomHoverColor(
      theme,
      ButtonVariantTypes.PRIMARY,
      backgroundColor,
    );

    expect(result1).toStrictEqual(expected1);

    // variant : PRIMARY without background
    const expected2 = theme.colors.button.primary.primary.hoverColor;
    const result2 = getCustomHoverColor(theme, ButtonVariantTypes.PRIMARY);
    expect(result2).toStrictEqual(expected2);

    // variant : SECONDARY
    const expected3 = "#dcfeef";
    const result3 = getCustomHoverColor(
      theme,
      ButtonVariantTypes.SECONDARY,
      backgroundColor,
    );

    expect(result3).toStrictEqual(expected3);

    // variant : SECONDARY without background
    const expected4 = theme.colors.button.primary.secondary.hoverColor;
    const result4 = getCustomHoverColor(theme, ButtonVariantTypes.SECONDARY);
    expect(result4).toStrictEqual(expected4);

    // variant : TERTIARY
    const expected5 = "#dcfeef";
    const result5 = getCustomHoverColor(
      theme,
      ButtonVariantTypes.TERTIARY,
      backgroundColor,
    );
    expect(result5).toStrictEqual(expected5);

    // variant : TERTIARY without background
    const expected6 = theme.colors.button.primary.tertiary.hoverColor;
    const result6 = getCustomHoverColor(theme, ButtonVariantTypes.TERTIARY);
    expect(result6).toStrictEqual(expected6);
  });

  it("validate escaping special characters", () => {
    const testString = `a\nb\nc
hello! how are you?
`;
    const result = escapeSpecialChars(testString);
    const expectedResult = "a\nb\nc\nhello! how are you?\n";
    expect(result).toStrictEqual(expectedResult);
  });

  it("Check if the color is lightened with lightenColor utility", () => {
    /**
     * Colors with :
     *   0% brightness = #000000,
     * > 40% brightness = #696969
     * > 50% brightness = #8a8a8a
     * > 60% brightness = #b0b0b0
     * > 70% brightness = #d6d4d4
     */

    const actualColors = [
      "#000000",
      "#696969",
      "#8a8a8a",
      "#b0b0b0",
      "#d6d4d4",
    ];
    const lightColors = ["#ededed", "#ededed", "#ededed", "#ededed", "#eeeded"];

    actualColors.forEach((color, idx) => {
      expect(lightenColor(color)).toEqual(lightColors[idx]);
    });
  });
});

describe(".sanitizeKey", () => {
  it("returns sanitized value when passed a valid string", () => {
    const inputAndExpectedOutput = [
      ["lowercase", "lowercase"],
      ["__abc__", "__abc__"],
      ["lower_snake_case", "lower_snake_case"],
      ["UPPER_SNAKE_CASE", "UPPER_SNAKE_CASE"],
      ["PascalCase", "PascalCase"],
      ["camelCase", "camelCase"],
      ["lower-kebab-case", "lower_kebab_case"],
      ["UPPER_KEBAB-CASE", "UPPER_KEBAB_CASE"],
      ["Sentencecase", "Sentencecase"],
      ["", "_"],
      ["with space", "with_space"],
      ["with multiple  spaces", "with_multiple__spaces"],
      ["with%special)characters", "with_special_characters"],
      ["with%$multiple_spl.)characters", "with__multiple_spl__characters"],
      ["1startingWithNumber", "_1startingWithNumber"],
    ];

    inputAndExpectedOutput.forEach(([input, expectedOutput]) => {
      const result = sanitizeKey(input);
      expect(result).toEqual(expectedOutput);
    });
  });

  it("returns sanitized value when valid string with existing keys and reserved keys", () => {
    const existingKeys = [
      "__id",
      "__restricted__",
      "firstName1",
      "_1age",
      "gender",
      "poll123",
      "poll124",
      "poll125",
      "address_",
    ];

    const inputAndExpectedOutput = [
      ["lowercase", "lowercase"],
      ["__abc__", "__abc__"],
      ["lower_snake_case", "lower_snake_case"],
      ["UPPER_SNAKE_CASE", "UPPER_SNAKE_CASE"],
      ["PascalCase", "PascalCase"],
      ["camelCase", "camelCase"],
      ["lower-kebab-case", "lower_kebab_case"],
      ["UPPER_KEBAB-CASE", "UPPER_KEBAB_CASE"],
      ["Sentencecase", "Sentencecase"],
      ["", "_"],
      ["with space", "with_space"],
      ["with multiple  spaces", "with_multiple__spaces"],
      ["with%special)characters", "with_special_characters"],
      ["with%$multiple_spl.)characters", "with__multiple_spl__characters"],
      ["1startingWithNumber", "_1startingWithNumber"],
      ["1startingWithNumber", "_1startingWithNumber"],
      ["firstName", "firstName"],
      ["firstName1", "firstName2"],
      ["1age", "_1age1"],
      ["address&", "address_1"],
      ["%&id", "__id1"],
      ["%&restricted*(", "__restricted__1"],
      ["poll130", "poll130"],
      ["poll124", "poll126"],
      ["हिन्दि", "xn__j2bd4cyac6f"],
      ["😃", "xn__h28h"],
    ];

    inputAndExpectedOutput.forEach(([input, expectedOutput]) => {
      const result = sanitizeKey(input, {
        existingKeys,
      });
      expect(result).toEqual(expectedOutput);
    });
  });
});

describe("Test widget utility functions", () => {
  it("case: fontSizeUtility returns the font sizes based on variant", () => {
    const expectedFontSize = "0.75rem";

    expect(fontSizeUtility(TextSizes.PARAGRAPH2)).toEqual(expectedFontSize);
  });

  it("case: borderRadiusUtility returns the borderRadius based on borderRadius variant", () => {
    const expectedBorderRadius = "0.375rem";
    expect(borderRadiusUtility(ButtonBorderRadiusTypes.ROUNDED)).toEqual(
      expectedBorderRadius,
    );
  });

  it("case: boxShadowColorUtility returns the new boxShadow by replacing default boxShadowColor with new boxShadowColor", () => {
    const boxShadow = "0px 0px 4px 3px rgba(0, 0, 0, 0.25)";
    const boxShadowColor = "red";
    const expectedBoxShadow = "0px 0px 4px 3px red";
    expect(boxShadowColorUtility(boxShadow, boxShadowColor)).toEqual(
      expectedBoxShadow,
    );
  });

  it("case: boxShadowUtility returns the new boxShadow", () => {
    const variants = [
      "VARIANT1",
      "VARIANT2",
      "VARIANT3",
      "VARIANT4",
      "VARIANT5",
    ];
    let newBoxShadowColor = rgbaMigrationConstant;
    let expectedBoxShadows = [
      `0px 0px 4px 3px ${newBoxShadowColor}`,
      `3px 3px 4px ${newBoxShadowColor}`,
      `0px 1px 3px ${newBoxShadowColor}`,
      `2px 2px 0px  ${newBoxShadowColor}`,
      `-2px -2px 0px ${newBoxShadowColor}`,
    ];

    // Check the boxShadow when the boxShadowColor is set to default;
    variants.forEach((value: string, index: number) => {
      expect(boxShadowUtility(value, newBoxShadowColor)).toEqual(
        expectedBoxShadows[index],
      );
    });

    // Check the boxShadow when the boxShadowColor is set to custom color;
    newBoxShadowColor = "red";
    expectedBoxShadows = [
      `0px 0px 4px 3px ${newBoxShadowColor}`,
      `3px 3px 4px ${newBoxShadowColor}`,
      `0px 1px 3px ${newBoxShadowColor}`,
      `2px 2px 0px  ${newBoxShadowColor}`,
      `-2px -2px 0px ${newBoxShadowColor}`,
    ];
    variants.forEach((value: string, index: number) => {
      expect(boxShadowUtility(value, newBoxShadowColor)).toEqual(
        expectedBoxShadows[index],
      );
    });
  });

  it("case: boxShadowDynamicChecker returns correct boxShadow whenever boxShadow and boxShadowColor ar dynamic", () => {
    /**
     * Function usd inside table widget cell properties for Icon and menu button types.
     * This function is used to run theming migration boxShadow and boxShadowColor has dynamic bindings
     * Function runs for the following scenarios, when:
     * 1. boxShadow: Static; boxShadowColor: Dynamic
     * 2. boxShadow: Dynamic; boxShadowColor: Static
     * 3. boxShadow: Dynamic; boxShadowColor: empty
     * 4. boxShadow: Dynamic; boxShadowColor: dynamic
     */

    // Case 1:
    expect(
      boxShadowDynamicChecker(
        tableWidgetProps as any,
        "action",
        tableWidgetProps.primaryColumns.action.boxShadow,
        tableWidgetProps.primaryColumns.action.boxShadowColor[0],
      ),
    ).toEqual("0px 0px 4px 3px red");

    // Case 2 & 3:
    // Make boxShadow dynamic
    /**
     * 1. Add the boxShadow to the DBPL
     * 2. Remove boxShadowColor from the DBPL
     * 3. Assign the action.boxShadowcolor as a static value.
     * 4. Assign the action.boxShadowcolor as a empty value.
     */
    tableWidgetProps.dynamicBindingPathList.push({
      key: "primaryColumns.action.boxShadow",
    });
    // Remove boxShadowColor from dynamicBindingPathList
    remove(
      tableWidgetProps.dynamicBindingPathList,
      (value: { key: string }) =>
        value.key === "primaryColumns.action.boxShadowColor",
    );
    // Assign values to boxShadow and boxShadowColor
    tableWidgetProps.primaryColumns.action.boxShadow = "VARIANT1";
    tableWidgetProps.primaryColumns.action.boxShadowColor = "blue" as any;
    let newBoxShadow = boxShadowDynamicChecker(
      tableWidgetProps as any,
      "action",
      tableWidgetProps.primaryColumns.action.boxShadow,
      tableWidgetProps.primaryColumns.action.boxShadowColor,
    );
    expect(newBoxShadow).toEqual("0px 0px 4px 3px blue");

    tableWidgetProps.primaryColumns.action.boxShadow = "VARIANT1";
    tableWidgetProps.primaryColumns.action.boxShadowColor = "" as any; // Add empty boxShadowColor.

    newBoxShadow = boxShadowDynamicChecker(
      tableWidgetProps as any,
      "action",
      tableWidgetProps.primaryColumns.action.boxShadow,
      tableWidgetProps.primaryColumns.action.boxShadowColor,
    );
    expect(newBoxShadow).toEqual("0px 0px 4px 3px rgba(0, 0, 0, 0.25)");

    // Case 4:
    // Add boxShadow and boxShadowColor to the dynamicBindingPathList
    tableWidgetProps.dynamicBindingPathList = [
      ...tableWidgetProps.dynamicBindingPathList,
      {
        key: "primaryColumns.action.boxShadow",
      },
      {
        key: "primaryColumns.action.boxShadowColor",
      },
    ];

    // Assign values to boxShadow and boxShadowColor
    tableWidgetProps.primaryColumns.action.boxShadow = "VARIANT1";
    tableWidgetProps.primaryColumns.action.boxShadowColor = [
      "orange",
      "orange",
      "orange",
    ];
    newBoxShadow = boxShadowDynamicChecker(
      tableWidgetProps as any,
      "action",
      tableWidgetProps.primaryColumns.action.boxShadow,
      tableWidgetProps.primaryColumns.action.boxShadowColor[0],
    );
    expect(newBoxShadow).toEqual("0px 0px 4px 3px orange");

    tableWidgetProps.primaryColumns.action.boxShadow = "VARIANT1";
    tableWidgetProps.primaryColumns.action.boxShadowColor = ["", "", ""] as any; // Add empty boxShadowColor when dynamic

    // Add empty boxShadowColor.
    newBoxShadow = boxShadowDynamicChecker(
      tableWidgetProps as any,
      "action",
      tableWidgetProps.primaryColumns.action.boxShadow,
      tableWidgetProps.primaryColumns.action.boxShadowColor[0],
    );
    expect(newBoxShadow).toEqual("0px 0px 4px 3px rgba(0, 0, 0, 0.25)");
  });
});
