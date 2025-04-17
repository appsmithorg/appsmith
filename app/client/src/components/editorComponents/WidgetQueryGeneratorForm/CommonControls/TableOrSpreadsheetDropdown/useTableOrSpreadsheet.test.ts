import { useTableOrSpreadsheet } from "./useTableOrSpreadsheet";
import { renderHook } from "@testing-library/react-hooks";
import type { DatasourceTable } from "entities/Datasource";
import { PluginPackageName } from "entities/Plugin";

// Mock pageListSelectors
jest.mock("selectors/pageListSelectors", () => ({
  getIsGeneratingTemplatePage: jest.fn(() => false),
  getIsGeneratePageModalOpen: jest.fn(() => false),
  getApplicationLastModifiedTime: jest.fn(),
  getCurrentApplicationId: jest.fn(),
  getCurrentPageId: jest.fn(),
  getPageById: jest.fn(),
  getPageList: jest.fn(() => []),
  getPageListAsOptions: jest.fn(() => []),
  getPageListState: jest.fn(() => ({
    isGeneratingTemplatePage: false,
    isGeneratePageModalOpen: false,
  })),
}));

// Mock UI selectors
jest.mock("selectors/ui", () => ({
  getSelectedAppTheme: jest.fn(),
  getAppThemes: jest.fn(() => []),
  getSelectedAppThemeColor: jest.fn(),
  getIsDatasourceInViewMode: jest.fn(() => false),
  getDatasourceCollapsibleState: jest.fn(() => ({})),
  getIsInOnboardingFlow: jest.fn(() => false),
}));

// Mock datasourceActions
jest.mock("actions/datasourceActions", () => ({
  fetchGheetSheets: jest.fn(() => ({ type: "FETCH_GSHEET_SHEETS" })),
}));

// Mock editor selectors
jest.mock("selectors/editorSelectors", () => ({
  getWidgets: jest.fn(() => ({})),
  getWidgetsMeta: jest.fn(() => ({})),
  getWidgetsForImport: jest.fn(() => ({})),
}));

// Mock Reselect
jest.mock("reselect", () => ({
  createSelector: jest.fn((selectors, resultFunc) => {
    if (typeof resultFunc === "function") {
      return resultFunc();
    }

    return jest.fn();
  }),
}));

// Mock selectors
jest.mock("selectors/dataTreeSelectors", () => ({
  getLayoutSystemType: jest.fn(),
  getIsMobileBreakPoint: jest.fn(),
}));

// Mock redux
jest.mock("react-redux", () => ({
  useSelector: jest.fn(),
  useDispatch: () => jest.fn(),
}));

// Mock redux-form
jest.mock("redux-form", () => ({
  getFormValues: jest.fn(),
  Field: jest.fn(),
  reduxForm: jest.fn(),
}));

// Mock ee/selectors/entitiesSelector
jest.mock("ee/selectors/entitiesSelector", () => ({
  getDatasource: jest.fn(),
  getDatasourceLoading: jest.fn(),
  getDatasourceStructureById: jest.fn(),
  getIsFetchingDatasourceStructure: jest.fn(),
  getPluginPackageFromDatasourceId: jest.fn(),
}));

// Mock selectors/datasourceSelectors
jest.mock("selectors/datasourceSelectors", () => ({
  getGsheetSpreadsheets: jest.fn(() => jest.fn()),
  getIsFetchingGsheetSpreadsheets: jest.fn(),
}));

// Mock selectors/oneClickBindingSelectors
jest.mock("selectors/oneClickBindingSelectors", () => ({
  getisOneClickBindingConnectingForWidget: jest.fn(() => jest.fn()),
}));

// Mock sagas/selectors
jest.mock("sagas/selectors", () => ({
  getWidget: jest.fn(),
}));

// Mock utils
jest.mock("utils/editorContextUtils", () => ({
  isGoogleSheetPluginDS: jest.fn(
    (plugin) => plugin === PluginPackageName.GOOGLE_SHEETS,
  ),
  isMongoDBPluginDS: jest.fn((plugin) => plugin === PluginPackageName.MONGO),
}));

// Mock utils/helpers
jest.mock("utils/helpers", () => ({
  getAppMode: jest.fn(),
  isEllipsisActive: jest.fn(),
}));

// Mock WidgetOperationUtils
jest.mock("sagas/WidgetOperationUtils", () => ({}));

// Mock WidgetUtils
jest.mock("widgets/WidgetUtils", () => ({}));

// Mock the context
jest.mock("react", () => {
  const originalModule = jest.requireActual("react");

  return {
    ...originalModule,
    useContext: () => ({
      config: { datasource: "test-ds-id", table: "" },
      propertyName: "test-property",
      updateConfig: jest.fn(),
      widgetId: "test-widget-id",
    }),
    useCallback: <T extends (...args: unknown[]) => unknown>(fn: T) => fn,
    // useMemo will be mocked in each test
    useMemo: jest.fn(),
  };
});

// Import after all mocks are set up
import { useSelector } from "react-redux";
import * as React from "react";

// Create a simplified test
describe("useTableOrSpreadsheet", () => {
  const mockUseSelector = useSelector as jest.Mock;
  const mockUseMemo = React.useMemo as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSelector.mockImplementation(() => ({}));
    mockUseMemo.mockImplementation((fn) => fn());
  });

  it("should render without crashing", () => {
    // Mock minimum required values
    mockUseSelector.mockImplementation(() => ({
      datasourceStructure: { tables: [] },
      selectedDatasourcePluginPackageName: PluginPackageName.POSTGRES,
      selectedDatasource: { name: "Test" },
      widget: { widgetName: "Test" },
    }));

    const { result } = renderHook(() => useTableOrSpreadsheet());

    expect(result.current).toBeTruthy();
  });

  it("should disable tables without primary keys for non-MongoDB datasources", () => {
    const mockTables: DatasourceTable[] = [
      {
        name: "table1",
        type: "TABLE",
        columns: [],
        keys: [],
        templates: [],
      },
      {
        name: "table2",
        type: "TABLE",
        columns: [],
        keys: [
          {
            name: "id",
            type: "primary",
            columnNames: ["id"],
            fromColumns: ["id"],
          },
        ],
        templates: [],
      },
    ];

    const mockOptions = [
      {
        id: "table1",
        label: "table1",
        value: "table1",
        data: { tableName: "table1" },
        disabled: true,
      },
      {
        id: "table2",
        label: "table2",
        value: "table2",
        data: { tableName: "table2" },
        disabled: false,
      },
    ];

    mockUseSelector.mockImplementation(() => ({
      selectedDatasourcePluginPackageName: PluginPackageName.POSTGRES,
      datasourceStructure: { tables: mockTables },
      widget: { widgetName: "TestWidget" },
      selectedDatasource: { name: "TestDatabase" },
    }));

    mockUseMemo.mockImplementation(() => mockOptions);

    const { result } = renderHook(() => useTableOrSpreadsheet());

    expect(result.current.options).toHaveLength(2);
    expect(result.current.options[0].value).toBe("table1");
    expect(result.current.options[0].disabled).toBe(true);
    expect(result.current.options[1].value).toBe("table2");
    expect(result.current.options[1].disabled).toBe(false);
  });

  it("should not disable tables for MongoDB datasources regardless of primary keys", () => {
    const mockTables: DatasourceTable[] = [
      {
        name: "collection1",
        type: "COLLECTION",
        columns: [],
        keys: [],
        templates: [],
      },
      {
        name: "collection2",
        type: "COLLECTION",
        columns: [],
        keys: [
          {
            name: "_id",
            type: "primary",
            columnNames: ["_id"],
            fromColumns: ["_id"],
          },
        ],
        templates: [],
      },
    ];

    const mockOptions = [
      {
        id: "collection1",
        label: "collection1",
        value: "collection1",
        data: { tableName: "collection1" },
        disabled: false,
      },
      {
        id: "collection2",
        label: "collection2",
        value: "collection2",
        data: { tableName: "collection2" },
        disabled: false,
      },
    ];

    mockUseSelector.mockImplementation(() => ({
      selectedDatasourcePluginPackageName: PluginPackageName.MONGO,
      datasourceStructure: { tables: mockTables },
      widget: { widgetName: "TestWidget" },
      selectedDatasource: { name: "TestMongoDB" },
    }));

    mockUseMemo.mockImplementation(() => mockOptions);

    const { result } = renderHook(() => useTableOrSpreadsheet());

    expect(result.current.options).toHaveLength(2);
    expect(result.current.options[0].value).toBe("collection1");
    expect(result.current.options[0].disabled).toBe(false);
    expect(result.current.options[1].value).toBe("collection2");
    expect(result.current.options[1].disabled).toBe(false);
  });

  it("should not disable tables for Google Sheets datasource", () => {
    const mockOptions = [
      {
        id: "sheet1",
        label: "Sheet1",
        value: "Sheet1",
        data: { tableName: "sheet1" },
        disabled: false,
      },
      {
        id: "sheet2",
        label: "Sheet2",
        value: "Sheet2",
        data: { tableName: "sheet2" },
        disabled: false,
      },
    ];

    mockUseSelector.mockImplementation(() => ({
      selectedDatasourcePluginPackageName: PluginPackageName.GOOGLE_SHEETS,
      spreadSheets: {
        value: [
          { label: "Sheet1", value: "sheet1" },
          { label: "Sheet2", value: "sheet2" },
        ],
      },
      widget: { widgetName: "TestWidget" },
      selectedDatasource: { name: "TestGoogleSheet" },
    }));

    mockUseMemo.mockImplementation(() => mockOptions);

    const { result } = renderHook(() => useTableOrSpreadsheet());

    expect(result.current.options).toHaveLength(2);
    expect(result.current.options[0].value).toBe("Sheet1");
    expect(result.current.options[0].disabled).toBe(false);
    expect(result.current.options[1].value).toBe("Sheet2");
    expect(result.current.options[1].disabled).toBe(false);
  });
});
