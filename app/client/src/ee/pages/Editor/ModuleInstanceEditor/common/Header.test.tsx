import React from "react";
import { render, fireEvent, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import "@testing-library/jest-dom";

import Header from "./Header";
import store from "store";
import * as entitiesSelector from "@appsmith/selectors/entitiesSelector";
import { MODULE_TYPE } from "@appsmith/constants/ModuleConstants";
import { builderURL } from "@appsmith/RouteBuilder";
import type { ModuleInstance } from "@appsmith/constants/ModuleInstanceConstants";
import { ThemeProvider } from "styled-components";
import { lightTheme } from "selectors/themeSelectors";

const DEFAULT_MODULE_INSTANCE = {
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

const DEFAULT_PAGE_ID = "default-page-id";

const mockedHistoryFn = jest.fn();

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useHistory: () => ({
    push: mockedHistoryFn,
  }),
}));

jest.mock("design-system", () => ({
  ...jest.requireActual("design-system"),
  Link: (props: any) => <a {...props} />,
}));

jest.mock("./ModuleInstanceNameEditor", () => {
  return {
    __esModule: true,
    default: () => {
      return <div>Module instance name editor </div>;
    },
  };
});

jest.mock("@appsmith/selectors/entitiesSelector");

describe("Header", () => {
  beforeEach(() => {
    const entitiesSelectorFactory = entitiesSelector as jest.Mocked<
      typeof entitiesSelector
    >;
    entitiesSelectorFactory.getCurrentPageId.mockImplementation(
      () => DEFAULT_PAGE_ID,
    );
  });

  it("renders without crashing", () => {
    render(
      <Provider store={store}>
        <ThemeProvider theme={lightTheme}>
          <Header
            isExecutePermitted={false}
            moduleInstance={DEFAULT_MODULE_INSTANCE}
            onRunClick={jest.fn()}
          />
        </ThemeProvider>
      </Provider>,
    );
  });

  it("shows module instance name editor", () => {
    render(
      <Provider store={store}>
        <Header
          isExecutePermitted={false}
          moduleInstance={DEFAULT_MODULE_INSTANCE}
          onRunClick={jest.fn()}
        />
      </Provider>,
    );

    expect(screen.getByText("Module instance name editor")).toBeInTheDocument();
  });

  it("calls history.push when the Back button is clicked", () => {
    const { getByText } = render(
      <Provider store={store}>
        <Header
          isExecutePermitted={false}
          moduleInstance={DEFAULT_MODULE_INSTANCE}
          onRunClick={jest.fn()}
        />
      </Provider>,
    );
    const backButton = getByText("Back");

    fireEvent.click(backButton);

    // Ensure that history.push is called with the correct arguments
    expect(mockedHistoryFn).toHaveBeenCalledWith(
      builderURL({
        pageId: DEFAULT_PAGE_ID,
      }),
    );
  });

  it("calls onRunClick when run button is clicked", () => {
    const onRunClick = jest.fn();

    const { getByText } = render(
      <Provider store={store}>
        <Header
          isExecutePermitted
          moduleInstance={DEFAULT_MODULE_INSTANCE}
          onRunClick={onRunClick}
        />
      </Provider>,
    );
    const runButton = getByText("Run");

    fireEvent.click(runButton);

    // Ensure that history.push is called with the correct arguments
    expect(onRunClick).toBeCalledTimes(1);
  });

  it("shouldn't call onRunClick when execute permission is false", () => {
    const onRunClick = jest.fn();

    const { getByText } = render(
      <Provider store={store}>
        <Header
          isExecutePermitted={false}
          moduleInstance={DEFAULT_MODULE_INSTANCE}
          onRunClick={onRunClick}
        />
      </Provider>,
    );
    const runButton = getByText("Run");

    fireEvent.click(runButton);

    // Ensure that history.push is called with the correct arguments
    expect(onRunClick).toBeCalledTimes(0);
  });
});
