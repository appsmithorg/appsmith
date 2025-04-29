import { renderHook } from "@testing-library/react-hooks";
import React from "react";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import { WidgetQueryGeneratorFormContext } from "../..";
import { DROPDOWN_VARIANT } from "../DatasourceDropdown/types";
import { useTableOrSpreadsheet } from "./useTableOrSpreadsheet";

const mockStore = configureStore([]);

describe("useTableOrSpreadsheet", () => {
  it("returns correct options and labelText for minimal valid state", () => {
    // Minimal mock Redux state
    const state = {
      entities: {
        datasources: {
          list: [{ id: "ds1", name: "TestDatasource", pluginId: "plugin1" }],
          structure: {
            ds1: {
              id: "ds1",
              tables: [], // add mock tables if your test needs them
            },
          },
          fetchingDatasourceStructure: {
            ds1: false,
          },
          gsheetStructure: {
            spreadsheets: {
              ds1: [{ id: "123", label: "Sheet1", value: "sheet1" }],
            },
            isFetchingSpreadsheets: false,
          },
          loading: false,
        },
        plugins: {
          list: [
            { id: "plugin1", packageName: "TestPlugin", name: "TestPlugin" },
          ],
        },
        canvasWidgets: {
          Widget1: { widgetName: "Widget1", type: "TABLE_WIDGET" },
        },
      },
      ui: {
        oneClickBinding: {
          isConnecting: false,
          config: {
            widgetId: "Widget1",
          },
          showOptions: false,
        },
      },
    };
    const store = mockStore(state);

    // Minimal context value
    const contextValue = {
      config: {
        datasource: "ds1",
        datasourcePluginType: "DB",
        table: "", // instead of table: undefined
        datasourcePluginName: "TestPlugin",
        datasourceConnectionMode: "READ_WRITE",
        // Add other required config properties with dummy values if needed
        alias: {},
        sheet: "",
        searchableColumn: "",
        tableHeaderIndex: 1,
      },
      propertyName: "table",
      updateConfig: jest.fn(),
      widgetId: "Widget1",
      propertyValue: "",
      addBinding: jest.fn(),
      isSourceOpen: false,
      onSourceClose: jest.fn(),
      errorMsg: "",
      expectedType: "",
      sampleData: "",
      aliases: [],
      otherFields: [],
      excludePrimaryColumnFromQueryGeneration: false,
      isConnectableToWidget: false,
      datasourceDropdownVariant: DROPDOWN_VARIANT.CONNECT_TO_DATASOURCE, // Use the correct enum or string
      alertMessage: null,
      // Add any other required fields with dummy values
    };

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>
        <WidgetQueryGeneratorFormContext.Provider value={contextValue}>
          {children}
        </WidgetQueryGeneratorFormContext.Provider>
      </Provider>
    );

    const { result } = renderHook(() => useTableOrSpreadsheet(), { wrapper });

    expect(result.current.labelText).toContain("Select");
    expect(result.current.labelText).toContain("TestDatasource");
    expect(Array.isArray(result.current.options)).toBe(true);
  });

  it("should disable tables without primary keys for non-MongoDB datasources", () => {
    // Mock state for regular SQL datasource with tables that have and don't have primary keys
    const state = {
      entities: {
        datasources: {
          list: [{ id: "ds1", name: "PostgresDB", pluginId: "plugin1" }],
          structure: {
            ds1: {
              id: "ds1",
              tables: [
                {
                  name: "table_with_pk",
                  keys: [
                    { name: "id_pk", type: "primary key", columnNames: ["id"] },
                  ],
                  columns: [{ name: "id", type: "integer" }],
                },
                {
                  name: "table_without_pk",
                  keys: [],
                  columns: [{ name: "data", type: "text" }],
                },
              ],
            },
          },
          fetchingDatasourceStructure: {
            ds1: false,
          },
          gsheetStructure: {
            spreadsheets: {
              ds1: [],
            },
            isFetchingSpreadsheets: false,
          },
          loading: false,
        },
        plugins: {
          list: [
            { id: "plugin1", packageName: "postgres", name: "PostgreSQL" },
          ],
        },
        canvasWidgets: {
          Widget1: { widgetName: "Widget1", type: "TABLE_WIDGET" },
        },
      },
      ui: {
        oneClickBinding: {
          isConnecting: false,
          config: {
            widgetId: "Widget1",
          },
          showOptions: false,
        },
      },
    };
    const store = mockStore(state);

    const contextValue = {
      config: {
        datasource: "ds1",
        datasourcePluginType: "DB",
        table: "",
        datasourcePluginName: "postgres",
        datasourceConnectionMode: "READ_WRITE",
        alias: {},
        sheet: "",
        searchableColumn: "",
        tableHeaderIndex: 1,
      },
      propertyName: "table",
      updateConfig: jest.fn(),
      widgetId: "Widget1",
      propertyValue: "",
      addBinding: jest.fn(),
      isSourceOpen: false,
      onSourceClose: jest.fn(),
      errorMsg: "",
      expectedType: "",
      sampleData: "",
      aliases: [],
      otherFields: [],
      excludePrimaryColumnFromQueryGeneration: false,
      isConnectableToWidget: false,
      datasourceDropdownVariant: DROPDOWN_VARIANT.CONNECT_TO_DATASOURCE,
      alertMessage: null,
    };

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>
        <WidgetQueryGeneratorFormContext.Provider value={contextValue}>
          {children}
        </WidgetQueryGeneratorFormContext.Provider>
      </Provider>
    );

    const { result } = renderHook(() => useTableOrSpreadsheet(), { wrapper });

    // Verify that table with primary key is enabled
    const tableWithPkOption = result.current.options.find(
      (option) => option.value === "table_with_pk",
    );
    expect(tableWithPkOption?.disabled).toBe(false);

    // Verify that table without primary key is disabled
    const tableWithoutPkOption = result.current.options.find(
      (option) => option.value === "table_without_pk",
    );
    expect(tableWithoutPkOption?.disabled).toBe(true);
  });

  it("should not disable tables for MongoDB datasources regardless of primary keys", () => {
    // Mock state for MongoDB datasource
    const state = {
      entities: {
        datasources: {
          list: [{ id: "ds1", name: "MongoDB", pluginId: "plugin1" }],
          structure: {
            ds1: {
              id: "ds1",
              tables: [
                {
                  name: "collection1",
                  keys: [],
                  columns: [{ name: "_id", type: "objectId" }],
                },
                {
                  name: "collection2",
                  keys: [],
                  columns: [{ name: "data", type: "object" }],
                },
              ],
            },
          },
          fetchingDatasourceStructure: {
            ds1: false,
          },
          gsheetStructure: {
            spreadsheets: {
              ds1: [],
            },
            isFetchingSpreadsheets: false,
          },
          loading: false,
        },
        plugins: {
          list: [
            { id: "plugin1", packageName: "mongo-plugin", name: "MongoDB" },
          ],
        },
        canvasWidgets: {
          Widget1: { widgetName: "Widget1", type: "TABLE_WIDGET" },
        },
      },
      ui: {
        oneClickBinding: {
          isConnecting: false,
          config: {
            widgetId: "Widget1",
          },
          showOptions: false,
        },
      },
    };
    const store = mockStore(state);

    const contextValue = {
      config: {
        datasource: "ds1",
        datasourcePluginType: "DB",
        table: "",
        datasourcePluginName: "mongo",
        datasourceConnectionMode: "READ_WRITE",
        alias: {},
        sheet: "",
        searchableColumn: "",
        tableHeaderIndex: 1,
      },
      propertyName: "table",
      updateConfig: jest.fn(),
      widgetId: "Widget1",
      propertyValue: "",
      addBinding: jest.fn(),
      isSourceOpen: false,
      onSourceClose: jest.fn(),
      errorMsg: "",
      expectedType: "",
      sampleData: "",
      aliases: [],
      otherFields: [],
      excludePrimaryColumnFromQueryGeneration: false,
      isConnectableToWidget: false,
      datasourceDropdownVariant: DROPDOWN_VARIANT.CONNECT_TO_DATASOURCE,
      alertMessage: null,
    };

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>
        <WidgetQueryGeneratorFormContext.Provider value={contextValue}>
          {children}
        </WidgetQueryGeneratorFormContext.Provider>
      </Provider>
    );

    const { result } = renderHook(() => useTableOrSpreadsheet(), { wrapper });

    // Verify that all tables for MongoDB are not disabled, regardless of primary keys
    result.current.options.forEach((option) => {
      expect(option.disabled).toBe(false);
    });
  });

  it("should not disable tables for Google Sheets datasource", () => {
    // Mock state for Google Sheets datasource
    const state = {
      entities: {
        datasources: {
          list: [{ id: "ds1", name: "Sheets", pluginId: "plugin1" }],
          structure: {
            ds1: {
              id: "ds1",
              tables: [],
            },
          },
          fetchingDatasourceStructure: {
            ds1: false,
          },
          gsheetStructure: {
            spreadsheets: {
              ds1: [
                { id: "sheet1", label: "Sheet1", value: "sheet1" },
                { id: "sheet2", label: "Sheet2", value: "sheet2" },
              ],
            },
            isFetchingSpreadsheets: false,
          },
          loading: false,
        },
        plugins: {
          list: [
            {
              id: "plugin1",
              packageName: "google-sheets-plugin",
              name: "Google Sheets",
            },
          ],
        },
        canvasWidgets: {
          Widget1: { widgetName: "Widget1", type: "TABLE_WIDGET" },
        },
      },
      ui: {
        oneClickBinding: {
          isConnecting: false,
          config: {
            widgetId: "Widget1",
          },
          showOptions: false,
        },
      },
    };
    const store = mockStore(state);

    const contextValue = {
      config: {
        datasource: "ds1",
        datasourcePluginType: "SAAS",
        table: "",
        datasourcePluginName: "google-sheets",
        datasourceConnectionMode: "READ_WRITE",
        alias: {},
        sheet: "",
        searchableColumn: "",
        tableHeaderIndex: 1,
      },
      propertyName: "table",
      updateConfig: jest.fn(),
      widgetId: "Widget1",
      propertyValue: "",
      addBinding: jest.fn(),
      isSourceOpen: false,
      onSourceClose: jest.fn(),
      errorMsg: "",
      expectedType: "",
      sampleData: "",
      aliases: [],
      otherFields: [],
      excludePrimaryColumnFromQueryGeneration: false,
      isConnectableToWidget: false,
      datasourceDropdownVariant: DROPDOWN_VARIANT.CONNECT_TO_DATASOURCE,
      alertMessage: null,
    };

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>
        <WidgetQueryGeneratorFormContext.Provider value={contextValue}>
          {children}
        </WidgetQueryGeneratorFormContext.Provider>
      </Provider>
    );

    const { result } = renderHook(() => useTableOrSpreadsheet(), { wrapper });

    // Verify that all spreadsheets are not disabled
    result.current.options.forEach((option) => {
      expect(option.disabled).toBe(false);
    });
  });
});
