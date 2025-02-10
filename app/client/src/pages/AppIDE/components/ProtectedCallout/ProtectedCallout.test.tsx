import React from "react";
import { render } from "@testing-library/react";
import { merge } from "lodash";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import { BrowserRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import store from "../../../../store";
import ProtectedCallout from "./ProtectedCallout";

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

jest.mock("../../layout/routers/MainPane.tsx", () => () => <div />);
jest.mock("../../layout/routers/LeftPane", () => () => <div />);
jest.mock("../../layout/routers/RightPane", () => () => <div />);
jest.mock("../../layout/routers/Sidebar", () => () => <div />);
jest.mock("../../../../components/BottomBar", () => () => <div />);

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
          <ProtectedCallout />
        </BrowserRouter>
      </Provider>,
    );

    expect(getByTestId("t--git-protected-branch-callout")).toBeInTheDocument();
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
          <ProtectedCallout />
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
