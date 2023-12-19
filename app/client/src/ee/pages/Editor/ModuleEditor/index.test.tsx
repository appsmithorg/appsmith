import React from "react";
import { klona } from "klona";
import { render } from "@testing-library/react";
import { BrowserRouter as Router } from "react-router-dom"; // Use BrowserRouter for testing
import "@testing-library/jest-dom";

import ModuleEditor from "./";
import store from "store";
import * as modulesSelector from "@appsmith/selectors/modulesSelector";
import * as moduleActions from "@appsmith/actions/moduleActions";
import { MODULE_TYPE, type Module } from "@appsmith/constants/ModuleConstants";
import type { ModuleEditorProps } from "./";
import { Provider } from "react-redux";

const mockDispatch = jest.fn();

jest.mock("@appsmith/actions/moduleActions");
jest.mock("@appsmith/selectors/modulesSelector");
jest.mock("react-redux", () => ({
  ...jest.requireActual("react-redux"),
  useDispatch: () => mockDispatch,
}));

const DEFAULT_MODULE = {
  id: "module-id",
  packageId: "6528d5f14b7c8d700a1026c9",
  inputsForm: [],
  settingsForm: [],
  name: "Module 1",
  type: MODULE_TYPE.QUERY,
  userPermissions: [],
} as unknown as Module;

const DEFAULT_ROUTE_MATCH_PARAMS = {
  isExact: true,
  path: "/your/path",
  url: "/your/url",
  params: {
    moduleId: "yourModuleId",
  },
};

const setIsModuleFetchingEntities = (value: boolean) => {
  const modulesSelectorFactory = modulesSelector as jest.Mocked<
    typeof modulesSelector
  >;
  modulesSelectorFactory.getIsModuleFetchingEntities.mockImplementation(
    () => value,
  );
};

const mockGetModuleById = ({
  override = {} as Partial<Module>,
  setDefault = true,
} = {}) => {
  const modulesSelectorFactory = modulesSelector as jest.Mocked<
    typeof modulesSelector
  >;

  const module = setDefault ? { ...DEFAULT_MODULE, ...override } : undefined;
  modulesSelectorFactory.getModuleById.mockImplementation(() => module);
};

const mockSetupModule = () => {
  const moduleActionsFactory = moduleActions as jest.Mocked<
    typeof moduleActions
  >;
  const mockFn = jest.fn();
  moduleActionsFactory.setupModule.mockImplementation(mockFn);

  return mockFn;
};

describe("ModuleEditor Component", () => {
  it("renders loading spinner when module is fetching actions", () => {
    const matchParams = klona(DEFAULT_ROUTE_MATCH_PARAMS);
    matchParams.params.moduleId = "module-id";
    const props = {
      match: matchParams,
    } as ModuleEditorProps;

    mockGetModuleById();
    setIsModuleFetchingEntities(true);
    const mockedFetchAction = mockSetupModule();

    const { container } = render(
      <Provider store={store}>
        <Router>
          <ModuleEditor {...props} />
        </Router>
      </Provider>,
    );

    const loadingSpinner = container.querySelector(".ads-v2-spinner");
    expect(loadingSpinner).toBeInTheDocument();

    expect(mockedFetchAction).toBeCalledTimes(1);
    expect(mockedFetchAction).toBeCalledWith({ moduleId: DEFAULT_MODULE.id });
  });

  it("calls fetchModuleActions when moduleId changes", () => {
    const matchParams = klona(DEFAULT_ROUTE_MATCH_PARAMS);
    matchParams.params.moduleId = "module-id";
    const props = {
      match: matchParams,
    } as ModuleEditorProps;

    mockGetModuleById();
    setIsModuleFetchingEntities(true);
    const mockedFetchAction = mockSetupModule();

    const { rerender } = render(
      <Provider store={store}>
        <Router>
          <ModuleEditor {...props} />
        </Router>
      </Provider>,
    );

    expect(mockedFetchAction).toBeCalledTimes(1);

    const updatedProps = klona(props);
    const newModuleId = "new-module-id";
    updatedProps.match.params.moduleId = newModuleId;

    rerender(
      <Provider store={store}>
        <Router>
          <ModuleEditor {...updatedProps} />
        </Router>
      </Provider>,
    );

    expect(mockedFetchAction).toBeCalledTimes(2);
    expect(mockedFetchAction).toBeCalledWith({ moduleId: newModuleId });
  });

  it("does not call fetchModuleActions when moduleId stays same and component re-renders", () => {
    const matchParams = klona(DEFAULT_ROUTE_MATCH_PARAMS);
    matchParams.params.moduleId = "module-id";
    const props = {
      match: matchParams,
    } as ModuleEditorProps;

    mockGetModuleById();
    setIsModuleFetchingEntities(true);
    const mockedFetchAction = mockSetupModule();

    const { rerender } = render(
      <Provider store={store}>
        <Router>
          <ModuleEditor {...props} />
        </Router>
      </Provider>,
    );

    // Re-render with same props
    rerender(
      <Provider store={store}>
        <Router>
          <ModuleEditor {...props} />
        </Router>
      </Provider>,
    );

    expect(mockedFetchAction).toBeCalledTimes(1);
  });

  it("renders nothing when module not found", async () => {
    const matchParams = klona(DEFAULT_ROUTE_MATCH_PARAMS);
    matchParams.params.moduleId = "module-id";
    const props = {
      match: matchParams,
    } as ModuleEditorProps;

    mockGetModuleById({ setDefault: false });
    setIsModuleFetchingEntities(false);
    mockSetupModule();

    const { container } = render(
      <Provider store={store}>
        <Router>
          <ModuleEditor {...props} />
        </Router>
      </Provider>,
    );

    // Verify if nothing rendered
    expect(container.firstChild).toBeNull();
  });
});
