import React from "react";
import { render } from "@testing-library/react";
import { merge } from "lodash";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import IDE from ".";
import { BrowserRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import store from "store";

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getMockStore = (override: Record<string, any> = {}): any => {
  const initialState = store.getState();
  const slice = {
    ui: {
      ...initialState.ui,
      applications: {
        currentApplication: {
          gitApplicationMetadata: {
            branchName: "main",
            remoteUrl: "remote-url",
          },
        },
      },
      editor: {
        isPreviewMode: false,
      },
      gitSync: {
        protectedBranches: ["main"],
      },
    },
  };
  const mockStore = configureStore([]);
  const newSlice = merge(slice, override);

  return mockStore({
    ...initialState,
    ...newSlice,
  });
};

jest.mock("./MainPane", () => () => <div />);
jest.mock("./LeftPane", () => () => <div />);
jest.mock("./RightPane", () => () => <div />);
jest.mock("./Sidebar", () => () => <div />);
jest.mock("components/BottomBar", () => () => <div />);

const dispatch = jest.fn();

jest.mock("react-redux", () => {
  const originalModule = jest.requireActual("react-redux");

  return {
    ...originalModule,
    useDispatch: () => dispatch,
  };
});

describe("Protected callout test cases", () => {
  it("should render the protected view for IDE", () => {
    const store = getMockStore();
    const { getByTestId } = render(
      <Provider store={store}>
        <BrowserRouter>
          <IDE />
        </BrowserRouter>
      </Provider>,
    );

    expect(getByTestId("t--git-protected-branch-callout")).toBeInTheDocument();
  });

  it("should not render the protected view if branch is not protected", () => {
    const store = getMockStore({
      ui: {
        applications: {
          currentApplication: {
            gitApplicationMetadata: {
              branchName: "branch-1",
            },
          },
        },
        gitSync: {
          protectedBranches: ["main"],
        },
      },
    });
    const { queryByTestId } = render(
      <Provider store={store}>
        <BrowserRouter>
          <IDE />
        </BrowserRouter>
      </Provider>,
    );

    expect(
      queryByTestId("t--git-protected-branch-callout"),
    ).not.toBeInTheDocument();
  });
  it("should unprotect only the current branch if clicked on unprotect cta", () => {
    const store = getMockStore({
      ui: {
        applications: {
          currentApplication: {
            gitApplicationMetadata: {
              branchName: "branch-1",
            },
          },
        },
        gitSync: {
          protectedBranches: ["main", "branch-1", "branch-2"],
        },
      },
    });
    const { queryByTestId } = render(
      <Provider store={store}>
        <BrowserRouter>
          <IDE />
        </BrowserRouter>
      </Provider>,
    );

    queryByTestId("t--git-protected-unprotect-branch-cta")?.click();
    expect(dispatch).lastCalledWith({
      type: ReduxActionTypes.GIT_UPDATE_PROTECTED_BRANCHES_INIT,
      payload: { protectedBranches: ["main", "branch-2"] },
    });
  });
});
