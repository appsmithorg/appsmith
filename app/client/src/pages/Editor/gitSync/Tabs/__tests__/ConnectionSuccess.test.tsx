import React from "react";
import { render } from "@testing-library/react";
import ConnectionSuccess from "../ConnectionSuccess";

import configureStore from "redux-mock-store";
import { Provider } from "react-redux";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { GitSettingsTab } from "reducers/uiReducers/gitSyncReducer";

const initialState = {
  ui: {
    applications: {
      currentApplication: {
        gitApplicationMetadata: {
          branchName: "master",
          defaultBranchName: "master",
          remoteUrl: "git@github.com:delmuerto/book-app-ld.git",
          browserSupportedRemoteUrl: "https://github.com/delmuerto/book-app-ld",
          isRepoPrivate: true,
          repoName: "book-app-ld",
          defaultApplicationId: "xxx",
          lastCommittedAt: "2024-01-25T12:36:40Z",
        },
      },
    },
  },
};
const mockStore = configureStore();

const dispatch = jest.fn();
jest.mock("react-redux", () => {
  const originalModule = jest.requireActual("react-redux");
  return {
    ...originalModule,
    useDispatch: () => dispatch,
  };
});

describe("Connection Success Modal", () => {
  it("is rendered properly", () => {
    const store = mockStore(initialState);
    const { getByTestId } = render(
      <Provider store={store}>
        <ConnectionSuccess />
      </Provider>,
    );
    expect(getByTestId("t--git-success-modal-body")).toBeTruthy();
    expect(
      getByTestId("t--git-success-modal-start-using-git-cta"),
    ).toBeTruthy();
    expect(getByTestId("t--git-success-modal-open-settings-cta")).toBeTruthy();
  });

  it("go to settings cta button is working", () => {
    const store = mockStore(initialState);
    const { queryByTestId } = render(
      <Provider store={store}>
        <ConnectionSuccess />
      </Provider>,
    );
    expect(dispatch).toHaveBeenNthCalledWith(1, {
      type: ReduxActionTypes.FETCH_BRANCHES_INIT,
    });
    queryByTestId("t--git-success-modal-open-settings-cta")?.click();
    expect(dispatch).toHaveBeenNthCalledWith(3, {
      type: ReduxActionTypes.SET_IS_GIT_SYNC_MODAL_OPEN,
      payload: { isOpen: false },
    });
    expect(dispatch).toHaveBeenNthCalledWith(4, {
      type: ReduxActionTypes.GIT_SET_SETTINGS_MODAL_OPEN,
      payload: { open: true, tab: GitSettingsTab.GENERAL },
    });
  });

  it("start using git cta button is working", () => {
    const store = mockStore(initialState);
    const { queryByTestId } = render(
      <Provider store={store}>
        <ConnectionSuccess />
      </Provider>,
    );
    expect(dispatch).toHaveBeenNthCalledWith(1, {
      type: ReduxActionTypes.FETCH_BRANCHES_INIT,
    });
    queryByTestId("t--git-success-modal-start-using-git-cta")?.click();
    expect(dispatch).toHaveBeenNthCalledWith(3, {
      type: ReduxActionTypes.SET_IS_GIT_SYNC_MODAL_OPEN,
      payload: { isOpen: false },
    });
  });
});
