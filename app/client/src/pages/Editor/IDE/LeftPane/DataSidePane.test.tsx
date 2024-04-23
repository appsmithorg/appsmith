import React from "react";
import "@testing-library/jest-dom";
import { Provider } from "react-redux";
import { ThemeProvider } from "styled-components";
import store from "store";
import { BrowserRouter as Router } from "react-router-dom";
import { lightTheme } from "selectors/themeSelectors";
import { render, screen } from "@testing-library/react";
import DataSidePane from "./DataSidePane";
import {
  getActions,
  getCurrentPageId,
  getDatasources,
  getDatasourcesGroupedByPluginCategory,
  getPlugins,
} from "@appsmith/selectors/entitiesSelector";

const DEFAULT_PAGE_ID = "page-id";
const DEFAULT_DATASOURCES = [
  {
    id: "66177fc3594faa7345b28dd1",
    name: "Products",
    pluginId: "66163a54594faa7345b28cfe",
    workspaceId: "66163a78594faa7345b28d36",
  },
  {
    id: "66163c9f594faa7345b28d4a",

    name: "Users",
    pluginId: "66163a54594faa7345b28cfe",
    workspaceId: "66163a78594faa7345b28d36",
  },
];

const DEFAULT_GROUPED_DS = {
  Databases: [
    {
      id: "66177fc3594faa7345b28dd1",
      name: "Products",
      pluginId: "66163a54594faa7345b28cfe",
    },
    {
      id: "66163c9f594faa7345b28d4a",

      name: "Users",
      pluginId: "66163a54594faa7345b28cfe",
    },
  ],
};

const DEFAULT_PLUGINS = [
  {
    id: "66163a54594faa7345b28cfe",
    userPermissions: [],
    name: "PostgreSQL",
    type: "DB",
    packageName: "postgres-plugin",
    iconLocation: "https://assets.appsmith.com/logo/postgresql.svg",
    documentationLink:
      "https://docs.appsmith.com/reference/datasources/querying-postgres#create-crud-queries",
    responseType: "TABLE",
    uiComponent: "DbEditorForm",
    datasourceComponent: "AutoForm",
    generateCRUDPageComponent: "PostgreSQL",
    allowUserDatasources: true,
    isRemotePlugin: false,
  },
];

const DEFAULT_ACTIONS = [
  {
    config: {
      datasource: {
        id: "66163c9f594faa7345b28d4a",
      },
      pageId: "66163a79594faa7345b28d40",
    },
  },
  {
    config: {
      id: "6625e0365633023bc8aa95b6",
      name: "Query2",
      datasource: {
        id: "66163c9f594faa7345b28d4a",
      },
      pageId: "66163a79594faa7345b28d40",
    },
  },
  {
    config: {
      id: "66177fd1594faa7345b28dd6",
      name: "Api1",
      datasource: {
        name: "DEFAULT_REST_DATASOURCE",
      },
    },
  },
];

jest.mock("@appsmith/selectors/entitiesSelector");

describe("DataSidePane", () => {
  beforeEach(() => {
    jest.resetAllMocks();

    (getCurrentPageId as jest.Mock).mockReturnValue(DEFAULT_PAGE_ID);
    (getDatasources as jest.Mock).mockReturnValue(DEFAULT_DATASOURCES);
    (getPlugins as jest.Mock).mockReturnValue(DEFAULT_PLUGINS);
    (getActions as jest.Mock).mockReturnValue(DEFAULT_ACTIONS);
    (
      getDatasourcesGroupedByPluginCategory as unknown as jest.Mock
    ).mockReturnValue(DEFAULT_GROUPED_DS);
  });

  it("renders entityName as 'queries' when it's not passed as prop", () => {
    render(
      <Provider store={store}>
        <ThemeProvider theme={lightTheme}>
          <Router>
            <DataSidePane />
          </Router>
        </ThemeProvider>
      </Provider>,
    );
    expect(screen.getByText("Databases")).toBeInTheDocument();
    expect(screen.getByText("Products")).toBeInTheDocument();
    expect(screen.getByText("Users")).toBeInTheDocument();

    const usersDSParentElement =
      screen.getByText("Users").parentElement?.parentElement;

    expect(usersDSParentElement).toHaveTextContent("2 queries in this app");

    const productsDSParentElement =
      screen.getByText("Products").parentElement?.parentElement;

    expect(productsDSParentElement).toHaveTextContent("No queries in this app");
  });

  it("renders entityName correctly when passed as prop", () => {
    render(
      <Provider store={store}>
        <ThemeProvider theme={lightTheme}>
          <Router>
            <DataSidePane entityName="testEntity" />
          </Router>
        </ThemeProvider>
      </Provider>,
    );
    expect(screen.getByText("Databases")).toBeInTheDocument();
    expect(screen.getByText("Products")).toBeInTheDocument();
    expect(screen.getByText("Users")).toBeInTheDocument();

    const usersDSParentElement =
      screen.getByText("Users").parentElement?.parentElement;

    expect(usersDSParentElement).toHaveTextContent("2 testEntity in this app");

    const productsDSParentElement =
      screen.getByText("Products").parentElement?.parentElement;

    expect(productsDSParentElement).toHaveTextContent(
      "No testEntity in this app",
    );
  });

  it("renders the count from actionCount when passed as prop", () => {
    const actionCount = {
      "66163c9f594faa7345b28d4a": 10, // Users DS
      "66177fc3594faa7345b28dd1": 20, // Products DS
    };

    render(
      <Provider store={store}>
        <ThemeProvider theme={lightTheme}>
          <Router>
            <DataSidePane actionCount={actionCount} entityName="testEntity" />
          </Router>
        </ThemeProvider>
      </Provider>,
    );
    expect(screen.getByText("Databases")).toBeInTheDocument();
    expect(screen.getByText("Products")).toBeInTheDocument();
    expect(screen.getByText("Users")).toBeInTheDocument();

    const usersDSParentElement =
      screen.getByText("Users").parentElement?.parentElement;

    expect(usersDSParentElement).toHaveTextContent("10 testEntity in this app");

    const productsDSParentElement =
      screen.getByText("Products").parentElement?.parentElement;

    expect(productsDSParentElement).toHaveTextContent(
      "20 testEntity in this app",
    );
  });
});
