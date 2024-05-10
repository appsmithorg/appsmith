import React from "react";
import { queryByText, render } from "@testing-library/react";
import JSResponseView from "./JSResponseView";
import * as actionExecutionUtils from "@appsmith/utils/actionExecutionUtils";
import configureStore from "redux-mock-store";
import { Provider } from "react-redux";
import { ThemeProvider } from "styled-components";
import { unitTestBaseMockStore } from "layoutSystems/common/dropTarget/unitTestUtils";
import { lightTheme } from "selectors/themeSelectors";
import { BrowserRouter as Router } from "react-router-dom";
import { EditorViewMode } from "@appsmith/entities/IDE/constants";
import type { JSCollectionData } from "@appsmith/reducers/entityReducers/jsActionsReducer";
import { PluginType } from "entities/Action";
import "@testing-library/jest-dom/extend-expect";
import { EMPTY_RESPONSE_LAST_HALF } from "@appsmith/constants/messages";

jest.mock("@appsmith/utils/actionExecutionUtils");

const mockStore = configureStore([]);

const storeState = {
  ...unitTestBaseMockStore,
  evaluations: {
    tree: {},
  },
  ui: {
    ...unitTestBaseMockStore.ui,
    users: {
      featureFlag: {
        data: {},
        overriddenFlags: {},
      },
    },
    ide: {
      view: EditorViewMode.FullScreen,
    },
    debugger: {
      context: {
        errorCount: 0,
      },
    },
    jsPane: {
      debugger: {
        open: true,
        responseTabHeight: 200,
        selectedTab: "response",
      },
    },
    editor: {
      loadingStates: {
        savingEntity: false,
      },
    },
    // ee specific store
    workflowHistoryPane: {
      workflowRunDetails: {
        isLoading: false,
        data: {},
      },
      testRunContext: {
        isTriggering: false,
        testRunId: "",
      },
    },
  },
};

const collectionData: JSCollectionData = {
  isLoading: false,
  config: {
    id: "12",
    applicationId: "app1",
    workspaceId: "w1234",
    name: "asas",
    pageId: "page1",
    pluginId: "1122",
    pluginType: PluginType.JS,
    actions: [],
  },
  activeJSActionId: "123",
  data: {},
};

describe("JSResponseView", () => {
  let store: any;

  beforeEach(() => {
    store = mockStore(storeState);
  });
  it("should render correctly when isBrowserExecutionAllowed returns true", () => {
    // mock the return value of isBrowserExecutionAllowed
    (
      actionExecutionUtils.isBrowserExecutionAllowed as jest.Mock
    ).mockImplementation(() => true);

    const { getByText } = render(
      <Provider store={store}>
        <ThemeProvider theme={lightTheme}>
          <Router>
            <JSResponseView
              currentFunction={null}
              disabled={false}
              errors={[]}
              isLoading={false}
              jsCollectionData={collectionData}
              onButtonClick={function (): void {
                throw new Error("Function not implemented.");
              }}
            />
          </Router>
        </ThemeProvider>
      </Provider>,
    );
    expect(getByText(EMPTY_RESPONSE_LAST_HALF())).toBeInTheDocument();
  });

  it("should render correctly when isBrowserExecutionAllowed returns false", () => {
    // mock the return value of isBrowserExecutionAllowed
    (
      actionExecutionUtils.isBrowserExecutionAllowed as jest.Mock
    ).mockImplementation(() => false);

    render(
      <Provider store={store}>
        <ThemeProvider theme={lightTheme}>
          <Router>
            <JSResponseView
              currentFunction={null}
              disabled={false}
              errors={[]}
              isLoading={false}
              jsCollectionData={collectionData}
              onButtonClick={function (): void {
                throw new Error("Function not implemented.");
              }}
            />
          </Router>
        </ThemeProvider>
      </Provider>,
    );
    // nothing should be rendered here since the implementation for component is in EE code
    expect(queryByText(document.body, EMPTY_RESPONSE_LAST_HALF())).toBeNull();
  });
});
