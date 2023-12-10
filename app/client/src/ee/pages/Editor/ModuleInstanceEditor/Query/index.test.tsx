import React from "react";
import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import "@testing-library/jest-dom";
import type { QueryModuleInstanceEditorProps } from ".";
import QueryModuleInstanceEditor from ".";
import store from "store";
import { MODULE_TYPE } from "@appsmith/constants/ModuleConstants";
import type { ModuleInstance } from "@appsmith/constants/ModuleInstanceConstants";
import {
  getModuleInstanceById,
  getModuleInstancePublicAction,
} from "@appsmith/selectors/moduleInstanceSelectors";
import { getModuleById } from "@appsmith/selectors/modulesSelector";
import type { Action } from "entities/Action";
import { BrowserRouter as Router } from "react-router-dom";
import { lightTheme } from "selectors/themeSelectors";
import { ThemeProvider } from "styled-components";
import { noop } from "lodash";
import { klona } from "klona";

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

const DEFAULT_MODULE = {
  id: "test-module",
  name: "QueryModule1",
  type: "QUERY_MODULE",
  packageId: "654e24ca55aba27c364e5a32",
  inputsForm: [
    {
      id: "pjdquuvhxf",
      sectionName: "",
      children: [
        {
          id: "inp-1",
          label: "userId",
          propertyName: "inputs.userId",
          controlType: "TEXT_INPUT",
          defaultValue: "demoUser",
        },
        {
          id: "inp-2",
          label: "limit",
          propertyName: "inputs.limit",
          controlType: "TEXT_INPUT",
          defaultValue: 20,
        },
      ],
    },
  ],
  userPermissions: [
    "read:modules",
    "create:moduleExecutables",
    "create:moduleInstances",
    "manage:modules",
    "delete:modules",
  ],
  settingsForm: [
    {
      sectionName: "",
      id: 1,
      children: [
        {
          label: "Run query on page load",
          configProperty: "executeOnLoad",
          controlType: "SWITCH",
          subtitle: "Will refresh data each time the page is loaded",
        },
        {
          label: "Request confirmation before running query",
          configProperty: "confirmBeforeExecute",
          controlType: "SWITCH",
          subtitle:
            "Ask confirmation from the user each time before refreshing data",
        },
      ],
    },
  ],
};

const DEFAULT_ACTION = {
  id: "652535134b7c8d700a102652",
  workspaceId: "652519ba4b7c8d700a10263a",
  pluginType: "DB",
  pluginId: "6524fbb64b7c8d700a102609",
  name: "Query12",
  moduleInstanceId: "test-module-instance",
  actionConfiguration: {
    timeoutInMillisecond: 10000,
    paginationType: "NONE",
    encodeParamsToggle: true,
    body: "SELECT * from USERS LIMIT {{JSObjectNew.myVar1}}",
    selfReferencingDataPaths: [],
    pluginSpecifiedTemplates: [
      {
        value: true,
      },
    ],
  },
  executeOnLoad: false,
  confirmBeforeExecute: true,
  executableConfiguration: {
    timeoutInMillisecond: 10000,
    paginationType: "NONE",
    encodeParamsToggle: true,
    body: "SELECT * from USERS LIMIT {{JSObjectNew.myVar1}}",
    selfReferencingDataPaths: [],
    pluginSpecifiedTemplates: [
      {
        value: true,
      },
    ],
  },
} as unknown as Action;

let onFormValuesChangeTrigger = noop;

jest.mock("@appsmith/selectors/moduleInstanceSelectors", () => ({
  ...jest.requireActual("@appsmith/selectors/moduleInstanceSelectors"),
  getModuleInstanceById: jest.fn(),
  getModuleInstancePublicAction: jest.fn(),
}));
jest.mock("@appsmith/selectors/modulesSelector", () => ({
  ...jest.requireActual("@appsmith/selectors/modulesSelector"),
  getModuleById: jest.fn(),
}));
jest.mock("../common/InputsForm", () => {
  return {
    __esModule: true,
    default: () => {
      return <div>Inputs Form</div>;
    },
  };
});

jest.mock("./SettingsForm", () => {
  return {
    __esModule: true,
    default: (props: any) => {
      onFormValuesChangeTrigger = props.onFormValuesChange;
      return <div>Settings Form</div>;
    },
  };
});

const mockDispatch = jest.fn();
jest.mock("react-redux", () => ({
  ...jest.requireActual("react-redux"),
  useDispatch: () => mockDispatch,
}));

describe("QueryModuleInstanceEditor", () => {
  const props: QueryModuleInstanceEditorProps = {
    moduleInstanceId: DEFAULT_MODULE_INSTANCE.id,
  };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("renders loading spinner when module is missing", () => {
    (getModuleInstanceById as jest.Mock).mockReturnValueOnce(
      DEFAULT_MODULE_INSTANCE,
    );
    (getModuleById as jest.Mock).mockReturnValueOnce(null);
    (getModuleInstancePublicAction as jest.Mock).mockReturnValueOnce(
      DEFAULT_ACTION,
    );

    render(
      <Provider store={store}>
        <ThemeProvider theme={lightTheme}>
          <Router>
            <QueryModuleInstanceEditor {...props} />
          </Router>
        </ThemeProvider>
      </Provider>,
    );

    expect(screen.getByTestId("t--loader-module")).toBeInTheDocument();
  });

  it("renders loading spinner when module instance is missing", () => {
    (getModuleInstanceById as jest.Mock).mockReturnValueOnce(null);
    (getModuleById as jest.Mock).mockReturnValueOnce(DEFAULT_MODULE);
    (getModuleInstancePublicAction as jest.Mock).mockReturnValueOnce(
      DEFAULT_ACTION,
    );

    render(
      <Provider store={store}>
        <ThemeProvider theme={lightTheme}>
          <Router>
            <QueryModuleInstanceEditor {...props} />
          </Router>
        </ThemeProvider>
      </Provider>,
    );

    expect(screen.getByTestId("t--loader-module")).toBeInTheDocument();
  });

  it("renders loading spinner when public action is missing", () => {
    (getModuleInstanceById as jest.Mock).mockReturnValueOnce(
      DEFAULT_MODULE_INSTANCE,
    );
    (getModuleById as jest.Mock).mockReturnValueOnce(DEFAULT_MODULE);
    (getModuleInstancePublicAction as jest.Mock).mockReturnValueOnce(null);

    render(
      <Provider store={store}>
        <ThemeProvider theme={lightTheme}>
          <Router>
            <QueryModuleInstanceEditor {...props} />
          </Router>
        </ThemeProvider>
      </Provider>,
    );

    expect(screen.getByTestId("t--loader-module")).toBeInTheDocument();
  });

  it("renders component with correct data when moduleInstance and module are available", () => {
    (getModuleInstanceById as jest.Mock).mockReturnValue(
      DEFAULT_MODULE_INSTANCE,
    );
    (getModuleById as jest.Mock).mockReturnValue(DEFAULT_MODULE);
    (getModuleInstancePublicAction as jest.Mock).mockReturnValue(
      DEFAULT_ACTION,
    );

    render(
      <Provider store={store}>
        <ThemeProvider theme={lightTheme}>
          <Router>
            <QueryModuleInstanceEditor {...props} />
          </Router>
        </ThemeProvider>
      </Provider>,
    );

    expect(screen.getByText("Inputs Form")).toBeInTheDocument();
    expect(screen.getByText("Settings Form")).toBeInTheDocument();
  });

  it("dispatches onPageLoadSettings action when the executeOnLoad changes", () => {
    (getModuleInstanceById as jest.Mock).mockReturnValue(
      DEFAULT_MODULE_INSTANCE,
    );
    (getModuleById as jest.Mock).mockReturnValue(DEFAULT_MODULE);
    (getModuleInstancePublicAction as jest.Mock).mockReturnValue(
      DEFAULT_ACTION,
    );

    const updatedAction = klona(DEFAULT_ACTION);
    updatedAction.executeOnLoad = true;

    render(
      <Provider store={store}>
        <ThemeProvider theme={lightTheme}>
          <Router>
            <QueryModuleInstanceEditor {...props} />
          </Router>
        </ThemeProvider>
      </Provider>,
    );

    // Trigger change of executeOnLoad
    onFormValuesChangeTrigger(updatedAction);

    expect(mockDispatch).toHaveBeenCalledWith({
      type: "UPDATE_MODULE_INSTANCE_ON_PAGE_LOAD_SETTING_INIT",
      payload: {
        actionId: DEFAULT_ACTION.id,
        value: true,
      },
    });
  });

  it("dispatches updateModuleInstanceSettings action when other than executeOnLoad changes", () => {
    (getModuleInstanceById as jest.Mock).mockReturnValue(
      DEFAULT_MODULE_INSTANCE,
    );
    (getModuleById as jest.Mock).mockReturnValue(DEFAULT_MODULE);
    (getModuleInstancePublicAction as jest.Mock).mockReturnValue(
      DEFAULT_ACTION,
    );

    const updatedAction = klona(DEFAULT_ACTION);
    updatedAction.confirmBeforeExecute = false;

    render(
      <Provider store={store}>
        <ThemeProvider theme={lightTheme}>
          <Router>
            <QueryModuleInstanceEditor {...props} />
          </Router>
        </ThemeProvider>
      </Provider>,
    );

    // Trigger change of executeOnLoad
    onFormValuesChangeTrigger(updatedAction);

    expect(mockDispatch).toHaveBeenCalledWith({
      type: "UPDATE_MODULE_INSTANCE_SETTINGS_INIT",
      payload: updatedAction,
    });
  });
});
