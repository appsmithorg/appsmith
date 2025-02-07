import React from "react";
import { render } from "@testing-library/react";
import configureStore from "redux-mock-store";
import { Provider } from "react-redux";
import { ThemeProvider } from "styled-components";
import { unitTestBaseMockStore } from "layoutSystems/common/dropTarget/unitTestUtils";
import { lightTheme } from "selectors/themeSelectors";
import { BrowserRouter as Router } from "react-router-dom";
import { EditorViewMode } from "IDE/Interfaces/EditorTypes";
import "@testing-library/jest-dom/extend-expect";
import Debugger from "./Debugger";

jest.mock("components/editorComponents/Debugger/ErrorLogs/ErrorLog", () => ({
  __esModule: true,
  default: () => <div />,
}));

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
      isOpen: true,
      errors: {},
      expandId: "",
      hideErrors: false,
      context: {
        scrollPosition: 0,
        selectedDebuggerTab: "ERROR",
        responseTabHeight: 252.1953125,
        errorCount: 0,
        selectedDebuggerFilter: "error",
      },
      logs: [],
    },
  },
};

describe("ApiResponseView", () => {
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let store: any;

  beforeEach(() => {
    store = mockStore(storeState);
  });

  it("the container should have class select-text to enable the selection of text for user", () => {
    const { container } = render(
      <Provider store={store}>
        <ThemeProvider theme={lightTheme}>
          <Router>
            <Debugger />
          </Router>
        </ThemeProvider>
      </Provider>,
    );

    expect(
      container
        .querySelector(".t--datasource-bottom-pane-container")
        ?.classList.contains("select-text"),
    ).toBe(true);
  });
});
