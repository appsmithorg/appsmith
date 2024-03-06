import React from "react";
import { render, screen } from "@testing-library/react";
import * as routerMethods from "react-router";
import { ThemeProvider } from "styled-components";
import { Provider } from "react-redux";
import "@testing-library/jest-dom";
import store from "store";

import ModuleEditorDefaultRedirect from "./ModuleEditorDefaultRedirect";
import * as entitiesSelector from "@appsmith/selectors/entitiesSelector";
import * as modulesSelector from "@appsmith/selectors/modulesSelector";
import { lightTheme } from "selectors/themeSelectors";
import { PluginType, type Action } from "entities/Action";
import type { Plugin } from "api/PluginApi";
import type { Module } from "@appsmith/constants/ModuleConstants";

jest.mock("@appsmith/selectors/entitiesSelector");
jest.mock("@appsmith/selectors/modulesSelector");
jest.mock("react-router");

const DEFAULT_ENTITY = {
  id: "actionId",
  pluginId: "pluginId",
} as unknown as Action;

const QUERY_PLUGIN = {
  id: "pluginId",
  type: PluginType.DB,
} as unknown as Plugin;
const API_PLUGIN = {
  id: "pluginId",
  type: PluginType.API,
} as unknown as Plugin;
const SAAS_PLUGIN = {
  id: "pluginId",
  type: PluginType.SAAS,
  packageName: "google-sheets-plugin",
} as unknown as Plugin;
const REMOTE_PLUGIN = {
  id: "pluginId",
  type: PluginType.REMOTE,
} as unknown as Plugin;

const DEFAULT_MODULE = {
  id: "moduleId",
} as unknown as Module;

const setGetAction = (value?: Action) => {
  const modulesSelectorFactory = modulesSelector as jest.Mocked<
    typeof modulesSelector
  >;
  modulesSelectorFactory.getModulePublicAction.mockImplementation(() => value);
};

const setGetPlugins = (value: Plugin[]) => {
  const entitiesSelectorsFactory = entitiesSelector as jest.Mocked<
    typeof entitiesSelector
  >;
  entitiesSelectorsFactory.getPlugins.mockImplementation(() => value);
};

const setMockMatchPath = (value: routerMethods.match<object>) => {
  const routerMethodsFactory = routerMethods as jest.Mocked<
    typeof routerMethods
  >;
  routerMethodsFactory.matchPath.mockImplementation(() => value);
};

const setMockLocation = (value: any) => {
  const routerMethodsFactory = routerMethods as jest.Mocked<
    typeof routerMethods
  >;
  routerMethodsFactory.useLocation.mockImplementation(() => value);
};

function mockPathname(pathname: string) {
  Object.defineProperty(window, "location", {
    value: {
      pathname,
      search: "",
    },
    writable: true,
  });
}

describe("ModuleEditorDefaultRedirect Component", () => {
  let originalLocation: typeof window.location;

  beforeEach(() => {
    // Store the original location object
    originalLocation = window.location;
    const routerMethodsFactory = routerMethods as jest.Mocked<
      typeof routerMethods
    >;
    routerMethodsFactory.Redirect.mockImplementation(
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      ({ to }) => {
        return `Redirected to ${to}`;
      },
    );
  });

  afterEach(() => {
    // Restore the original location object after the test
    window.location = originalLocation;
  });
  it("should not redirect when isExact is false", () => {
    setMockMatchPath({ isExact: false } as routerMethods.match<object>);
    setMockLocation({ pathname: "" });

    const { container } = render(
      <ThemeProvider theme={lightTheme}>
        <Provider store={store}>
          <ModuleEditorDefaultRedirect module={DEFAULT_MODULE} />
        </Provider>
      </ThemeProvider>,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("should not redirect when no action is available", () => {
    setMockMatchPath({ isExact: true } as routerMethods.match<object>);
    setMockLocation({ pathname: "" });

    setGetAction();

    const { container } = render(
      <ThemeProvider theme={lightTheme}>
        <Provider store={store}>
          <ModuleEditorDefaultRedirect module={DEFAULT_MODULE} />
        </Provider>
      </ThemeProvider>,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("should not redirect when no plugin is available", () => {
    setMockMatchPath({ isExact: true } as routerMethods.match<object>);
    setMockLocation({ pathname: "" });

    setGetAction(DEFAULT_ENTITY);

    const { container } = render(
      <ThemeProvider theme={lightTheme}>
        <Provider store={store}>
          <ModuleEditorDefaultRedirect module={DEFAULT_MODULE} />
        </Provider>
      </ThemeProvider>,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("should redirect to the correct URL when isExact is true, action is available and entity is QUERY", () => {
    mockPathname("/pkg/package-id/module-id/edit");

    setMockMatchPath({ isExact: true } as routerMethods.match<object>);
    setMockLocation({ pathname: "" });

    setGetAction(DEFAULT_ENTITY);
    setGetPlugins([QUERY_PLUGIN]);

    render(
      <ThemeProvider theme={lightTheme}>
        <Provider store={store}>
          <ModuleEditorDefaultRedirect module={DEFAULT_MODULE} />
        </Provider>
      </ThemeProvider>,
    );

    expect(
      screen.getByText("Redirected to /queries/actionId"),
    ).toBeInTheDocument();
  });
  it("should redirect to the correct URL when isExact is true, action is available and entity is API", () => {
    mockPathname("/pkg/package-id/module-id/edit");

    setMockMatchPath({ isExact: true } as routerMethods.match<object>);
    setMockLocation({ pathname: "" });

    setGetAction(DEFAULT_ENTITY);
    setGetPlugins([API_PLUGIN]);

    render(
      <ThemeProvider theme={lightTheme}>
        <Provider store={store}>
          <ModuleEditorDefaultRedirect module={DEFAULT_MODULE} />
        </Provider>
      </ThemeProvider>,
    );

    expect(screen.getByText("Redirected to /api/actionId")).toBeInTheDocument();
  });
  it("should redirect to the correct URL when isExact is true, action is available and entity is SAAS", () => {
    mockPathname("/pkg/package-id/module-id/edit");

    setMockMatchPath({ isExact: true } as routerMethods.match<object>);
    setMockLocation({ pathname: "" });

    setGetAction(DEFAULT_ENTITY);
    setGetPlugins([SAAS_PLUGIN]);

    render(
      <ThemeProvider theme={lightTheme}>
        <Provider store={store}>
          <ModuleEditorDefaultRedirect module={DEFAULT_MODULE} />
        </Provider>
      </ThemeProvider>,
    );

    expect(
      screen.getByText(
        `Redirected to /saas/${SAAS_PLUGIN.packageName}/api/actionId`,
      ),
    ).toBeInTheDocument();
  });
  it("should redirect to the correct URL when isExact is true, action is available and entity plugin is REMOTE", () => {
    mockPathname("/pkg/package-id/module-id/edit");

    setMockMatchPath({ isExact: true } as routerMethods.match<object>);
    setMockLocation({ pathname: "" });

    setGetAction(DEFAULT_ENTITY);
    setGetPlugins([REMOTE_PLUGIN]);

    render(
      <ThemeProvider theme={lightTheme}>
        <Provider store={store}>
          <ModuleEditorDefaultRedirect module={DEFAULT_MODULE} />
        </Provider>
      </ThemeProvider>,
    );

    expect(
      screen.getByText("Redirected to /queries/actionId"),
    ).toBeInTheDocument();
  });
});
