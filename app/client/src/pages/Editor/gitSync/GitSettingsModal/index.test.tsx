import React from "react";
import { render } from "@testing-library/react";

import type { MockStoreEnhanced } from "redux-mock-store";
import configureStore from "redux-mock-store";
import { Provider } from "react-redux";
import { GitSettingsTab } from "reducers/uiReducers/gitSyncReducer";
import GitSettingsModal from ".";

const createInitialState = (overrideFn = (o: any) => o) => {
  const initialState = {
    ui: {
      gitSync: {
        isGitSettingsModalOpen: true,
        activeGitSettingsModalTab: "GENERAL",
      },
      applications: {
        currentApplication: {
          userPermissions: [
            "manageAutoCommit:applications",
            "manageProtectedBranches:applications",
            "manageDefaultBranches:applications",
            "connectToGit:applications",
          ],
          gitApplicationMetadata: {
            defaultBranchName: "master",
          },
        },
      },
      users: {
        featureFlag: {
          data: {
            license_git_continuous_delivery_enabled: true,
            release_git_continuous_delivery_enabled: true,
          },
        },
      },
    },
  };
  return overrideFn(initialState);
};
const mockStore = configureStore();

jest.mock("./TabGeneral", () => {
  return () => null;
});

jest.mock("./TabBranch", () => {
  return () => null;
});

jest.mock("@appsmith/components/gitComponents/GitSettingsCDTab", () => {
  return () => null;
});

const renderComponent = (store: MockStoreEnhanced<unknown, any>) => {
  return render(
    <Provider store={store}>
      <GitSettingsModal />
    </Provider>,
  );
};

describe("Git Settings Modal", () => {
  it("is rendered properly", () => {
    const store = mockStore(createInitialState());
    const { getByTestId } = renderComponent(store);
    expect(getByTestId("t--git-settings-modal")).toBeTruthy();
    expect(getByTestId(`t--tab-${GitSettingsTab.GENERAL}`)).toBeTruthy();
    expect(getByTestId(`t--tab-${GitSettingsTab.BRANCH}`)).toBeTruthy();
    expect(getByTestId(`t--tab-${GitSettingsTab.CD}`)).toBeTruthy();
  });

  it("is not rendering branch tab when neither of the features are enabled", () => {
    const initialState = createInitialState((initialState) => {
      const newState = { ...initialState };
      newState.ui.applications.currentApplication.userPermissions = [
        "manageAutoCommit:applications",
        "connectToGit:applications",
      ];
      return newState;
    });
    const store = mockStore(initialState);
    const { getByTestId, queryByTestId } = renderComponent(store);
    expect(getByTestId("t--git-settings-modal")).toBeTruthy();
    expect(getByTestId(`t--tab-${GitSettingsTab.GENERAL}`)).toBeTruthy();
    expect(queryByTestId(`t--tab-${GitSettingsTab.BRANCH}`)).not.toBeTruthy();
    expect(getByTestId(`t--tab-${GitSettingsTab.CD}`)).toBeTruthy();
  });

  it("is not rendering CD when feature flag is not enabled", () => {
    const initialState = createInitialState((initialState) => {
      const newState = { ...initialState };
      newState.ui.users.featureFlag.data = {
        license_git_continuous_delivery_enabled: false,
        release_git_continuous_delivery_enabled: false,
      };
      return newState;
    });
    const store = mockStore(initialState);
    const { getByTestId, queryByTestId } = renderComponent(store);
    expect(getByTestId("t--git-settings-modal")).toBeTruthy();
    expect(getByTestId(`t--tab-${GitSettingsTab.GENERAL}`)).toBeTruthy();
    expect(getByTestId(`t--tab-${GitSettingsTab.BRANCH}`)).toBeTruthy();
    expect(queryByTestId(`t--tab-${GitSettingsTab.CD}`)).not.toBeTruthy();
  });
});
