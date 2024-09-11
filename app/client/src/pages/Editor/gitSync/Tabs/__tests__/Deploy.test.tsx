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
import { COMMITTING_AND_PUSHING_CHANGES } from "ee/constants/messages";

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
        modified: ["application.json"],
        added: [
          "jslibs/UUID_https:__cdn.jsdelivr.net_npm_uuidjs@4.2.12_src_uuid.min.js.json",
        ],
        removed: [],
        pagesModified: [],
        pagesAdded: [],
        pagesRemoved: [],
        queriesModified: [],
        queriesAdded: [],
        queriesRemoved: [],
        jsObjectsModified: [],
        jsObjectsAdded: [],
        jsObjectsRemoved: [],
        datasourcesModified: [],
        datasourcesAdded: [],
        datasourcesRemoved: [],
        jsLibsModified: [],
        jsLibsAdded: ["UUID"],
        jsLibsRemoved: [],
        modifiedPages: 0,
        modifiedJSObjects: 0,
        modifiedDatasources: 0,
        modifiedQueries: 0,
        modifiedJSLibs: 1,
        conflicting: [],
        isClean: false,
        aheadCount: 0,
        behindCount: 0,
        remoteBranch: "refs/remotes/origin/master",
        discardDocUrl:
          "https://docs.appsmith.com/core-concepts/version-control-with-git/pull-and-sync#discard-and-pull-changes",
        migrationMessage: "",
      }),
    );
    const diffText = component.getByText("1 js lib added");
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
