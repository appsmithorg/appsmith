import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import "@testing-library/jest-dom";
import type { JSModuleInstanceEditorProps } from ".";
import JSModuleInstanceEditor from ".";
import store from "store";
import { MODULE_TYPE } from "@appsmith/constants/ModuleConstants";
import type { ModuleInstance } from "@appsmith/constants/ModuleInstanceConstants";
import {
  getModuleInstanceById,
  getModuleInstancePublicJSCollectionData,
} from "@appsmith/selectors/moduleInstanceSelectors";
import { getModuleById } from "@appsmith/selectors/modulesSelector";
import { BrowserRouter as Router } from "react-router-dom";
import { lightTheme } from "selectors/themeSelectors";
import { ThemeProvider } from "styled-components";
import { klona } from "klona";
import type { JSCollectionData } from "@appsmith/reducers/entityReducers/jsActionsReducer";

const DEFAULT_MODULE = {
  id: "test-module",
  name: "JSModule1",
  type: "JS_MODULE",
  packageId: "654e24ca55aba27c364e5a32",
  inputsForm: [
    {
      id: "pjdquuvhxf",
      sectionName: "",
      children: [],
    },
  ],
  userPermissions: [
    "read:modules",
    "create:moduleExecutables",
    "create:moduleInstances",
    "manage:modules",
    "delete:modules",
  ],
  settingsForm: [],
};

const DEFAULT_MODULE_INSTANCE = {
  id: "test-module-instance",
  type: MODULE_TYPE.JS,
  moduleId: DEFAULT_MODULE.id,
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

const DEFAULT_JS_COLLECTION_DATA = {
  isLoading: false,
  config: {
    id: "656ecb3b1a0d425da1cd3661",
    applicationId: "656dbfe11a0d425da1cd3644",
    workspaceId: "656db1f51a0d425da1cd360a",
    name: "JSObject1",
    pageId: "656dbfe11a0d425da1cd3647",
    pluginId: "6566e6924aa1dd03b3e42926",
    errorReports: [],
    pluginType: "JS",
    actionIds: [],
    archivedActionIds: [],
    moduleInstanceId: DEFAULT_MODULE_INSTANCE.id,
    isPublic: true,
    actions: [
      {
        id: "656ecb3b1a0d425da1cd365c",
        applicationId: "656dbfe11a0d425da1cd3644",
        workspaceId: "656db1f51a0d425da1cd360a",
        pluginType: "JS",
        pluginId: "6566e6924aa1dd03b3e42926",
        name: "myFun2",
        fullyQualifiedName: "JSObject1.myFun2",
        datasource: {
          userPermissions: [],
          name: "UNUSED_DATASOURCE",
          pluginId: "6566e6924aa1dd03b3e42926",
          workspaceId: "656db1f51a0d425da1cd360a",
          datasourceStorages: {},
          messages: [],
          isValid: true,
          new: true,
        },
        pageId: "656dbfe11a0d425da1cd3647",
        collectionId: "656ecb3b1a0d425da1cd3661",
        actionConfiguration: {
          timeoutInMillisecond: 10000,
          paginationType: "NONE",
          encodeParamsToggle: true,
          body: "async function (left, right = {}, bottom = []) {}",
          selfReferencingDataPaths: [],
          jsArguments: [],
        },
        executeOnLoad: false,
        clientSideExecution: true,
        dynamicBindingPathList: [
          {
            key: "body",
          },
        ],
        isValid: true,
        invalids: [],
        messages: [],
        jsonPathKeys: ["async function () {}"],
        confirmBeforeExecute: false,
        userPermissions: [
          "read:actions",
          "delete:actions",
          "execute:actions",
          "manage:actions",
        ],
        validName: "JSObject1.myFun2",
        entityReferenceType: "JSACTION",
        selfReferencingDataPaths: [],
      },
      {
        id: "656ecb3b1a0d425da1cd365d",
        applicationId: "656dbfe11a0d425da1cd3644",
        workspaceId: "656db1f51a0d425da1cd360a",
        pluginType: "JS",
        pluginId: "6566e6924aa1dd03b3e42926",
        name: "myFun1",
        fullyQualifiedName: "JSObject1.myFun1",
        datasource: {
          userPermissions: [],
          name: "UNUSED_DATASOURCE",
          pluginId: "6566e6924aa1dd03b3e42926",
          workspaceId: "656db1f51a0d425da1cd360a",
          datasourceStorages: {},
          messages: [],
          isValid: true,
          new: true,
        },
        pageId: "656dbfe11a0d425da1cd3647",
        collectionId: "656ecb3b1a0d425da1cd3661",
        actionConfiguration: {
          timeoutInMillisecond: 10000,
          paginationType: "NONE",
          encodeParamsToggle: true,
          body: 'function () {\n  return "100";\n}',
          selfReferencingDataPaths: [],
          jsArguments: [],
        },
        executeOnLoad: false,
        clientSideExecution: true,
        dynamicBindingPathList: [
          {
            key: "body",
          },
        ],
        isValid: true,
        invalids: [],
        messages: [],
        jsonPathKeys: ['function () {\n  return "100";\n}'],
        confirmBeforeExecute: true,
        userPermissions: [
          "read:actions",
          "delete:actions",
          "execute:actions",
          "manage:actions",
        ],
        validName: "JSObject1.myFun1",
        entityReferenceType: "JSACTION",
        selfReferencingDataPaths: [],
      },
    ],
    archivedActions: [],
    body: "export default {\n\tmyVar1: [],\n\tmyVar2: {},\n\tmyFun1 () {\n\t\t//\twrite code here\n\t\t//\tthis.myVar1 = [1,2,3]\n\t\treturn \"100\"\n\t},\n\tasync myFun2 () {\n\t\t//\tuse async-await or promises\n\t\t//\tawait storeValue('varName', 'hello world')\n\t}\n}",
    variables: [
      {
        name: "myVar1",
        value: "[]",
      },
      {
        name: "myVar2",
        value: "{}",
      },
    ],
    userPermissions: [
      "read:actions",
      "delete:actions",
      "execute:actions",
      "manage:actions",
    ],
  },
} as unknown as JSCollectionData;

jest.mock("@appsmith/selectors/moduleInstanceSelectors", () => ({
  ...jest.requireActual("@appsmith/selectors/moduleInstanceSelectors"),
  getModuleInstanceById: jest.fn(),
  getModuleInstancePublicJSCollectionData: jest.fn(),
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

const mockDispatch = jest.fn();
jest.mock("react-redux", () => ({
  ...jest.requireActual("react-redux"),
  useDispatch: () => mockDispatch,
}));

describe("JSModuleInstanceEditor", () => {
  const props = {
    moduleInstanceId: DEFAULT_MODULE_INSTANCE.id,
  } as unknown as JSModuleInstanceEditorProps;

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("renders loading spinner when module is missing", () => {
    (getModuleInstanceById as jest.Mock).mockReturnValueOnce(
      DEFAULT_MODULE_INSTANCE,
    );
    (getModuleById as jest.Mock).mockReturnValueOnce(null);
    (getModuleInstancePublicJSCollectionData as jest.Mock).mockReturnValueOnce(
      DEFAULT_JS_COLLECTION_DATA,
    );

    render(
      <Provider store={store}>
        <ThemeProvider theme={lightTheme}>
          <Router>
            <JSModuleInstanceEditor {...props} />
          </Router>
        </ThemeProvider>
      </Provider>,
    );

    expect(screen.getByTestId("t--loader-module")).toBeInTheDocument();
  });

  it("renders loading spinner when module instance is missing", () => {
    (getModuleInstanceById as jest.Mock).mockReturnValueOnce(null);
    (getModuleById as jest.Mock).mockReturnValueOnce(DEFAULT_MODULE);
    (getModuleInstancePublicJSCollectionData as jest.Mock).mockReturnValueOnce(
      DEFAULT_JS_COLLECTION_DATA,
    );

    render(
      <Provider store={store}>
        <ThemeProvider theme={lightTheme}>
          <Router>
            <JSModuleInstanceEditor {...props} />
          </Router>
        </ThemeProvider>
      </Provider>,
    );

    expect(screen.getByTestId("t--loader-module")).toBeInTheDocument();
  });

  it("renders loading spinner when public js collection is missing", () => {
    (getModuleInstanceById as jest.Mock).mockReturnValueOnce(
      DEFAULT_MODULE_INSTANCE,
    );
    (getModuleById as jest.Mock).mockReturnValueOnce(DEFAULT_MODULE);
    (getModuleInstancePublicJSCollectionData as jest.Mock).mockReturnValueOnce(
      null,
    );

    render(
      <Provider store={store}>
        <ThemeProvider theme={lightTheme}>
          <Router>
            <JSModuleInstanceEditor {...props} />
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
    (getModuleInstancePublicJSCollectionData as jest.Mock).mockReturnValue(
      DEFAULT_JS_COLLECTION_DATA,
    );

    render(
      <Provider store={store}>
        <ThemeProvider theme={lightTheme}>
          <Router>
            <JSModuleInstanceEditor {...props} />
          </Router>
        </ThemeProvider>
      </Provider>,
    );

    expect(screen.getByText("Function settings")).toBeInTheDocument();
    expect(screen.getByText("Parameters")).toBeInTheDocument();
  });

  it("dispatches updateModuleInstanceOnPageLoadSettings action when the executeOnLoad changes", () => {
    (getModuleInstanceById as jest.Mock).mockReturnValue(
      DEFAULT_MODULE_INSTANCE,
    );
    (getModuleById as jest.Mock).mockReturnValue(DEFAULT_MODULE);
    (getModuleInstancePublicJSCollectionData as jest.Mock).mockReturnValue(
      DEFAULT_JS_COLLECTION_DATA,
    );

    render(
      <Provider store={store}>
        <ThemeProvider theme={lightTheme}>
          <Router>
            <JSModuleInstanceEditor {...props} />
          </Router>
        </ThemeProvider>
      </Provider>,
    );

    const jsAction = DEFAULT_JS_COLLECTION_DATA.config.actions[0];
    const outerElement = document.getElementsByClassName(
      `${jsAction.name}-on-page-load-setting`,
    );
    const inputWithYes = outerElement[0].getElementsByTagName("input")[0];
    // Turn on execute on load
    fireEvent.click(inputWithYes);

    expect(mockDispatch).toHaveBeenCalledWith({
      type: "UPDATE_MODULE_INSTANCE_ON_PAGE_LOAD_SETTING_INIT",
      payload: {
        actionId: jsAction.id,
        value: true,
      },
    });

    const inputWithNo = outerElement[0].getElementsByTagName("input")[1];

    // Turn off execute on load
    fireEvent.click(inputWithNo);
    expect(mockDispatch).toHaveBeenCalledWith({
      type: "UPDATE_MODULE_INSTANCE_ON_PAGE_LOAD_SETTING_INIT",
      payload: {
        actionId: jsAction.id,
        value: false,
      },
    });
  });

  it("dispatches updateModuleInstanceSettings action when confirm before calling changes", () => {
    (getModuleInstanceById as jest.Mock).mockReturnValue(
      DEFAULT_MODULE_INSTANCE,
    );
    (getModuleById as jest.Mock).mockReturnValue(DEFAULT_MODULE);
    (getModuleInstancePublicJSCollectionData as jest.Mock).mockReturnValue(
      DEFAULT_JS_COLLECTION_DATA,
    );

    render(
      <Provider store={store}>
        <ThemeProvider theme={lightTheme}>
          <Router>
            <JSModuleInstanceEditor {...props} />
          </Router>
        </ThemeProvider>
      </Provider>,
    );

    // Choose a jsAction to modify
    const jsAction = DEFAULT_JS_COLLECTION_DATA.config.actions[0];

    // Setup expected payload
    const updatedJSCollection = klona(DEFAULT_JS_COLLECTION_DATA.config);
    updatedJSCollection.actions = updatedJSCollection.actions.map((a) => {
      return a.id === jsAction.id ? { ...a, confirmBeforeExecute: true } : a;
    });

    const outerElement = document.getElementsByClassName(
      `${jsAction.name}-confirm-before-execute`,
    );
    const inputWithYes = outerElement[0].getElementsByTagName("input")[0];
    screen.debug(inputWithYes);
    // Turn on confirm before calling
    fireEvent.click(inputWithYes);

    expect(mockDispatch).toHaveBeenCalledWith({
      type: "UPDATE_MODULE_INSTANCE_SETTINGS_INIT",
      payload: updatedJSCollection,
    });
  });
});
