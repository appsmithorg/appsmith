import React from "react";
import { Provider } from "react-redux";
import store from "store";
import { ThemeProvider } from "styled-components";
import { lightTheme } from "selectors/themeSelectors";
import { render } from "test/testUtils";
import Deploy from "../Deploy";
import {
  commitToRepoInit,
  fetchGitStatusSuccess,
} from "actions/gitSyncActions";
import { COMMITTING_AND_PUSHING_CHANGES } from "ce/constants/messages";

describe("Tests for git deploy modal", () => {
  it("Should show progress bar for JS Library diffs", () => {
    const component = render(
      <Provider store={store}>
        <ThemeProvider theme={lightTheme}>
          <Deploy />
        </ThemeProvider>
      </Provider>,
    );
    store.dispatch(
      fetchGitStatusSuccess({
        modified: [
          "jslibs/UUID_https:__cdn.jsdelivr.net_npm_uuidjs@4.2.12_src_uuid.min.js.json",
          "application.json",
        ],
        conflicting: [],
        isClean: false,
        modifiedJSLibs: 1,
        modifiedPages: 0,
        modifiedQueries: 0,
        modifiedJSObjects: 0,
        modifiedDatasources: 0,
        aheadCount: 0,
        behindCount: 0,
        remoteBranch: "refs/remotes/origin/master",
        discardDocUrl:
          "https://docs.appsmith.com/core-concepts/version-control-with-git/pull-and-sync#discard-and-pull-changes",
      }),
    );
    const diffText = component.getByText("1 library modified");
    expect(diffText).toBeDefined();
    store.dispatch(
      commitToRepoInit({
        commitMessage: "test",
        doPush: false,
      }),
    );
    const progressBar = component.getByText(COMMITTING_AND_PUSHING_CHANGES());
    expect(progressBar).toBeDefined();
  });
});
