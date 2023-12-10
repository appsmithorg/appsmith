import React from "react";
import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { ThemeProvider } from "styled-components";
import { BrowserRouter as Router } from "react-router-dom";
import "@testing-library/jest-dom";

import type { ModuleInstanceEditorProps } from ".";
import ModuleInstanceEditor from ".";
import store from "store";

import { lightTheme } from "selectors/themeSelectors";
import { BUILDER_PATH } from "constants/routes";
import { getModuleInstanceById } from "@appsmith/selectors/moduleInstanceSelectors";
import { MODULE_TYPE } from "@appsmith/constants/ModuleConstants";
import type { ModuleInstance } from "@appsmith/constants/ModuleInstanceConstants";

const DEFAULT_ROUTE_MATCH_PARAMS = {
  isExact: true,
  path: BUILDER_PATH,
  url: "app/app-slug/pageslug-pageId/edit/module-instance/test-module-instance",
  params: {
    moduleId: "test-module",
  },
};

const DEFAULT_QUERY_MODULE_INSTANCE = {
  id: "test-module-instance",
  type: MODULE_TYPE.QUERY,
  moduleId: "test-module",
  name: "QueryModule1",
  contextId: "652519c44b7c8d700a102643",
  contextType: "PAGE",
  // Inputs
  inputs: {
    userId: "testUser",
    token: "xxx",
  },
  settingsForm: [],
} as unknown as ModuleInstance;

const DEFAULT_JS_MODULE_INSTANCE = {
  id: "test-module-instance",
  type: MODULE_TYPE.JS,
  moduleId: "test-module",
  name: "JSModule1",
  contextId: "652519c44b7c8d700a102643",
  contextType: "PAGE",
  // Inputs
  inputs: {
    userId: "testUser",
    token: "xxx",
  },
  settingsForm: [],
} as unknown as ModuleInstance;

const props = {
  match: DEFAULT_ROUTE_MATCH_PARAMS,
} as unknown as ModuleInstanceEditorProps;

jest.mock("./Query", () => {
  return {
    __esModule: true,
    default: () => {
      return <div>Query Instance Editor</div>;
    },
  };
});

jest.mock("./JS", () => {
  return {
    __esModule: true,
    default: () => {
      return <div>JS Instance Editor</div>;
    },
  };
});

jest.mock("@appsmith/selectors/moduleInstanceSelectors", () => ({
  ...jest.requireActual("@appsmith/selectors/moduleInstanceSelectors"),
  getModuleInstanceById: jest.fn(),
}));

describe("ModuleInstanceEditor", () => {
  it("renders loader when moduleInstance is missing", () => {
    render(
      <Provider store={store}>
        <ThemeProvider theme={lightTheme}>
          <Router>
            <ModuleInstanceEditor {...props} />
          </Router>
        </ThemeProvider>
      </Provider>,
    );

    expect(screen.getByTestId("t--loader-module")).toBeInTheDocument();
  });

  it("renders query module when module instance type is query", () => {
    (getModuleInstanceById as jest.Mock).mockReturnValue(
      DEFAULT_QUERY_MODULE_INSTANCE,
    );

    render(
      <Provider store={store}>
        <ThemeProvider theme={lightTheme}>
          <Router>
            <ModuleInstanceEditor {...props} />
          </Router>
        </ThemeProvider>
      </Provider>,
    );

    expect(screen.getByText("Query Instance Editor")).toBeInTheDocument();
  });

  it("renders js module when module instance type is js", () => {
    (getModuleInstanceById as jest.Mock).mockReturnValue(
      DEFAULT_JS_MODULE_INSTANCE,
    );

    render(
      <Provider store={store}>
        <ThemeProvider theme={lightTheme}>
          <Router>
            <ModuleInstanceEditor {...props} />
          </Router>
        </ThemeProvider>
      </Provider>,
    );

    expect(screen.getByText("JS Instance Editor")).toBeInTheDocument();
  });
});
