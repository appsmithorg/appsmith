import React from "react";
import { render } from "@testing-library/react";
import ConnectionSuccess from "../ConnectionSuccess";

import configureStore from "redux-mock-store";
import { Provider } from "react-redux";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { GitSettingsTab } from "reducers/uiReducers/gitSyncReducer";
import { BrowserRouter } from "react-router-dom";
import { DOCS_BRANCH_PROTECTION_URL } from "constants/ThirdPartyConstants";

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

const renderComponent = () => {
  const store = mockStore(initialState);

  return render(
    <BrowserRouter>
      <Provider store={store}>
        <ConnectionSuccess />
      </Provider>
    </BrowserRouter>,
  );
};

describe("Connection Success Modal", () => {
  it("is rendered properly", () => {
    const { getByTestId } = renderComponent();

    expect(getByTestId("t--git-success-modal-body")).toBeTruthy();
    expect(
      getByTestId("t--git-success-modal-start-using-git-cta"),
    ).toBeTruthy();
    expect(getByTestId("t--git-success-modal-open-settings-cta")).toBeTruthy();
  });

  it("'Settings' cta button is working", () => {
    const { queryByTestId } = renderComponent();

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
      payload: { open: true, tab: GitSettingsTab.BRANCH },
    });
  });

  it("'Learn more' link has proper URL", () => {
    const { queryByTestId } = renderComponent();

    expect(
      queryByTestId("t--git-success-modal-learn-more-link")?.getAttribute(
        "href",
      ),
    ).toBe(DOCS_BRANCH_PROTECTION_URL);
    expect(
      queryByTestId("t--git-success-modal-learn-more-link")?.getAttribute(
        "target",
      ),
    ).toBe("_blank");
  });

  it("'Continue' cta button is working", () => {
    const { queryByTestId } = renderComponent();

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
