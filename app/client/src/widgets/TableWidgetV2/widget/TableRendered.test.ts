import { ResponsiveBehavior } from "layoutSystems/common/utils/constants";
import TableWidgetV2 from ".";
import type { TableWidgetProps } from "../constants";

describe("TableWidgetV2 getWidgetView", () => {
  const tableWidgetProps: TableWidgetProps = {
    customIsLoading: false,
    customIsLoadingValue: false,
    delimiter: ",",
    filteredTableData: [],
    isVisibleDownload: true,
    isVisibleFilters: true,
    isVisiblePagination: true,
    isVisibleSearch: true,
    pageSize: 10,
    primaryColumns: {},
    totalRecordsCount: 100,
    accentColor: "#000000",
    borderColor: "#000000",
    borderRadius: "40px",
    borderWidth: "1px",
    boxShadow: "none",
    canFreezeColumn: true,
    columnWidthMap: {},
    compactMode: "DEFAULT",
    filters: [],
    isAddRowInProgress: false,
    isEditableCellsValid: {},
    isLoading: false,
    isSortable: true,
    multiRowSelection: false,
    pageNo: 1,
    renderMode: "CANVAS",
    searchText: "",
    selectedRowIndex: -1,
    selectedRowIndices: [],
    serverSidePaginationEnabled: false,
    tableData: [],
    widgetId: "widgetId",
    widgetName: "TableWidget",
    componentWidth: 800,
    componentHeight: 600,
    onPageChange: "",
    onSearchTextChanged: "",
    onSort: "",
    onRowSelected: "",
    onAddNewRowSave: "",
    onAddNewRowDiscard: "",
    onBulkSave: "",
    onBulkDiscard: "",
    onPageSizeChange: "",
    commitBatchMetaUpdates: jest.fn(),
    pushBatchMetaUpdates: jest.fn(),
    updateWidgetMetaProperty: jest.fn(),
    updateWidgetProperty: "",
    updateOneClickBindingOptionsVisibility: "",
    // Added missing properties
    primaryColumnId: "",
    columnOrder: [],
    derivedColumns: {},
    dynamicPropertyPathList: [],
    dynamicTriggerPathList: [],
    dynamicBindingPathList: [],
    childStylesheet: {},
    isVisible: true,
    version: 1,
    parentColumnSpace: 1,
    parentRowSpace: 1,
    leftColumn: 0,
    rightColumn: 0,
    topRow: 0,
    bottomRow: 0,
    parentId: "",
    responsiveBehavior: ResponsiveBehavior.Hug,
    minWidth: 0,
    minHeight: 0,
    isDisabled: false,
    animateLoading: false,
    primaryColor: "",
    backgroundColor: "",
    textColor: "",
    fontFamily: "",
    fontSize: "",
    fontStyle: "",
    textAlign: "",
    textDecoration: "",
    textTransform: "",
    letterSpacing: "",
    lineHeight: "",
    whiteSpace: "",
    overflow: "",
    textOverflow: "",
    wordBreak: "",
    wordWrap: "",
    cursor: "",
    zIndex: 0,
    pristine: true,
    label: "TableWidget",
    defaultSearchText: "",
    sortOrder: { column: "", order: null },
    transientTableData: { data: { name: "name" } },
    newRow: {},
    firstEditableColumnIdByOrder: "",
    enableServerSideFiltering: false,
    onTableFilterUpdate: "",
    type: "",
    allowAddNewRow: false,
    defaultNewRow: {},
    frozenColumnIndices: { a: 1 },
  };

  describe("TableWidgetV2 loading checks", () => {
    describe("When custom loading logic is not provided", () => {
      it("Should not be loading with built-in property isLoading is set to false", () => {
        const tableWidget = new TableWidgetV2(tableWidgetProps);
        const widgetView = tableWidget.getWidgetView();

        expect(widgetView.props.children.props.isLoading).toBe(false);
      });
      it("Should be loading with built-in property isLoading is set to true", () => {
        const tableWidget = new TableWidgetV2({
          ...tableWidgetProps,
          isLoading: true,
        });
        const widgetView = tableWidget.getWidgetView();

        expect(widgetView.props.children.props.isLoading).toBe(true);
      });
    });
    describe("When custom loading logic is provided", () => {
      describe("When isLoading is false", () => {
        it("Should not be loading with isLoading: false,  customIsLoading: true and customIsLoadingTrue: true", () => {
          const tableWidget = new TableWidgetV2({
            ...tableWidgetProps,
            customIsLoading: true,
            customIsLoadingValue: false,
            isLoading: false,
          });
          const widgetView = tableWidget.getWidgetView();

          expect(widgetView.props.children.props.isLoading).toBe(false);
        });
        it("Should be loading with customIsLoading set to true and customIsLoadingTrue set to true", () => {
          const tableWidget = new TableWidgetV2({
            ...tableWidgetProps,
            customIsLoading: true,
            customIsLoadingValue: true,
            isLoading: false,
          });
          const widgetView = tableWidget.getWidgetView();

          expect(widgetView.props.children.props.isLoading).toBe(true);
        });
      });
      describe("When isLoading is true", () => {
        it("Should be loading with customIsLoading set to true and customIsLoadingTrue set to false", () => {
          const tableWidget = new TableWidgetV2({
            ...tableWidgetProps,
            customIsLoading: true,
            customIsLoadingValue: false,
            isLoading: true,
          });
          const widgetView = tableWidget.getWidgetView();

          expect(widgetView.props.children.props.isLoading).toBe(true);
        });
        it("Should be loading with customIsLoading set to true and customIsLoadingTrue set to true, even if in built loading is false", () => {
          const tableWidget = new TableWidgetV2({
            ...tableWidgetProps,
            customIsLoading: true,
            customIsLoadingValue: true,
            isLoading: true,
          });
          const widgetView = tableWidget.getWidgetView();

          expect(widgetView.props.children.props.isLoading).toBe(true);
        });
      });
    });
  });
});
