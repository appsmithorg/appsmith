import React from "react";
import { render } from "@testing-library/react";
import configureStore from "redux-mock-store";
import { Provider } from "react-redux";
import GitSyncModalV2 from "./GitSyncModalV2";
import { GitSyncModalTab } from "entities/GitSync";
import type { MockStoreEnhanced } from "redux-mock-store";
import { ThemeProvider } from "styled-components";
import { lightTheme } from "selectors/themeSelectors";

const createInitialState = (overrideFn = (o: any) => o) => {
  const initialState = {
    entities: {
      pageList: {
        applicationId: "app-smith-test", // replace with actual mock data
      },
    },
    ui: {
      gitSync: {
        isGitSyncModalOpen: true,
        activeGitSyncModalTab: GitSyncModalTab.DEPLOY,
        isGitConnected: true,
        branches: ["edit-test"],
        protectedBranches: ["master"],
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
            branchName: "fix: Refactor GitSyncModalV2 component ",
            defaultBranchName: "master",
            remoteUrl: "git@me.github.com:Saadat-B/appsmith.git",
            browserSupportedRemoteUrl:
              "git@me.github.com:Saadat-B/appsmith.git",
            isRepoPrivate: false,
            repoName: "appsmith",
            defaultApplicationId: "xxx",
            lastCommittedAt: "2024-05-01T12:36:40Z",
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

const renderComponent = (store: MockStoreEnhanced<unknown, any>) => {
  return render(
    <ThemeProvider theme={lightTheme}>
      <Provider store={store}>
        <GitSyncModalV2 />
      </Provider>
    </ThemeProvider>,
  );
};

describe("GitSyncModalV2", () => {
  it("shows Deploy when DEPLOY tab is active", async () => {
    const initialState = createInitialState((initialState) => {
      const newState = { ...initialState };
      return newState;
    });
    const store = mockStore(initialState);
    const { getByTestId } = renderComponent(store);
    expect(getByTestId("t--deploy-component")).toBeTruthy();
  });

  it("shows Merge when MERGE tab is active", async () => {
    const initialState = createInitialState((initialState) => {
      const newState = { ...initialState };

      newState.ui.gitSync = {
        ...newState.ui.gitSync,
        activeGitSyncModalTab: GitSyncModalTab.MERGE, // or GitSyncModalTab.DEPLOY for the deploy test
      };
      return newState;
    });
    const store = mockStore(initialState);
    const { getByTestId } = renderComponent(store);
    expect(getByTestId("t--merge-component")).toBeTruthy();
  });
});
