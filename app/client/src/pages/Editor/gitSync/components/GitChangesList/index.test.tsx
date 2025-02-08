import React from "react";
import { render } from "@testing-library/react";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import GitChangesList from ".";
import { merge } from "lodash";
import type { GitStatusData } from "reducers/uiReducers/gitSyncReducer";
import "@testing-library/jest-dom";

const getMockStore = (
  override: {
    gitStatus?: Partial<GitStatusData>;
    isFetchingGitStatus?: boolean;
  } = {},
) => {
  const statusSlice = {
    isFetchingGitStatus: false,
    gitStatus: {
      modified: [],
      added: [],
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
      jsLibsAdded: [],
      jsLibsRemoved: [],
      conflicting: [],
      isClean: true,
      aheadCount: 0,
      behindCount: 0,
      remoteBranch: "",
      discardDocUrl: "",
      migrationMessage: "",
    },
  };
  const mockStore = configureStore([]);
  const newStatusSlice = merge(statusSlice, override);

  return mockStore({
    ui: {
      gitSync: {
        ...newStatusSlice,
      },
    },
  });
};

describe("GitChangesList", () => {
  it("should render loading state when fetching git status", () => {
    const store = getMockStore({ isFetchingGitStatus: true });

    const { getByTestId } = render(
      <Provider store={store}>
        <GitChangesList />
      </Provider>,
    );

    expect(
      getByTestId("t--status-change-skeleton-loading"),
    ).toBeInTheDocument();
  });

  it("should render the component with empty status data", () => {
    const store = getMockStore({});

    const { queryByTestId } = render(
      <Provider store={store}>
        <GitChangesList />
      </Provider>,
    );

    expect(
      queryByTestId("t--status-change-DATASOURCES"),
    ).not.toBeInTheDocument();
    expect(queryByTestId("t--status-change-JSLIBS")).not.toBeInTheDocument();
    expect(
      queryByTestId("t--status-change-REMOTE_AHEAD"),
    ).not.toBeInTheDocument();
    expect(
      queryByTestId("t--status-change-REMOTE_BEHIND"),
    ).not.toBeInTheDocument();
    expect(queryByTestId("t--status-change-PACKAGES")).not.toBeInTheDocument();
    expect(queryByTestId("t--status-change-MODULES")).not.toBeInTheDocument();
    expect(queryByTestId("t--status-change-SETTINGS")).not.toBeInTheDocument();
    expect(queryByTestId("t--status-change-THEME")).not.toBeInTheDocument();
  });

  it("should render Page related changes", () => {
    const store = getMockStore({
      gitStatus: {
        pagesModified: ["Page1", "Page2"],
        pagesAdded: ["Page3"],
        pagesRemoved: ["Page4"],
      },
    });

    const { getByTestId, queryByTestId } = render(
      <Provider store={store}>
        <GitChangesList />
      </Provider>,
    );

    expect(getByTestId("t--status-change-PAGE-Page1")).toBeInTheDocument();
    expect(getByTestId("t--status-change-PAGE-Page2")).toBeInTheDocument();
    expect(getByTestId("t--status-change-PAGE-Page3")).toBeInTheDocument();
    expect(getByTestId("t--status-change-PAGE-Page4")).toBeInTheDocument();

    expect(
      queryByTestId("t--status-change-DATASOURCES"),
    ).not.toBeInTheDocument();
    expect(queryByTestId("t--status-change-JSLIBS")).not.toBeInTheDocument();
    expect(
      queryByTestId("t--status-change-REMOTE_AHEAD"),
    ).not.toBeInTheDocument();
    expect(
      queryByTestId("t--status-change-REMOTE_BEHIND"),
    ).not.toBeInTheDocument();
    expect(queryByTestId("t--status-change-PACKAGES")).not.toBeInTheDocument();
    expect(queryByTestId("t--status-change-MODULES")).not.toBeInTheDocument();
    expect(queryByTestId("t--status-change-SETTINGS")).not.toBeInTheDocument();
    expect(queryByTestId("t--status-change-THEME")).not.toBeInTheDocument();
  });

  it("should render Datasource related changes", () => {
    const store = getMockStore({
      gitStatus: {
        datasourcesModified: ["Datasource 1", "Datasource 2"],
        datasourcesAdded: ["Datasource 3"],
        datasourcesRemoved: ["Datasource 4"],
      },
    });

    const { getByTestId, queryByTestId } = render(
      <Provider store={store}>
        <GitChangesList />
      </Provider>,
    );

    expect(getByTestId("t--status-change-DATASOURCES")).toBeInTheDocument();
    expect(queryByTestId("t--status-change-JSLIBS")).not.toBeInTheDocument();
    expect(
      queryByTestId("t--status-change-REMOTE_AHEAD"),
    ).not.toBeInTheDocument();
    expect(
      queryByTestId("t--status-change-REMOTE_BEHIND"),
    ).not.toBeInTheDocument();
    expect(queryByTestId("t--status-change-PACKAGES")).not.toBeInTheDocument();
    expect(queryByTestId("t--status-change-MODULES")).not.toBeInTheDocument();
    expect(queryByTestId("t--status-change-SETTINGS")).not.toBeInTheDocument();
    expect(queryByTestId("t--status-change-THEME")).not.toBeInTheDocument();
  });

  it("should render Query related changes", () => {
    const store = getMockStore({
      gitStatus: {
        queriesModified: ["Page1/Query1", "Page2/Query2"],
        queriesAdded: ["Page1/Query3"],
        queriesRemoved: ["Page1/Query4"],
      },
    });

    const { getByTestId, queryByTestId } = render(
      <Provider store={store}>
        <GitChangesList />
      </Provider>,
    );

    const page1 = getByTestId("t--status-change-PAGE-Page1");
    const page2 = getByTestId("t--status-change-PAGE-Page2");

    expect(page1).toBeInTheDocument();
    expect(page2).toBeInTheDocument();

    page1.click();
    page2.click();

    expect(
      page1.querySelectorAll("[data-testid=t--status-change-QUERIES]").length,
    ).toBeGreaterThan(0);

    expect(
      page2.querySelectorAll("[data-testid=t--status-change-QUERIES]").length,
    ).toBeGreaterThan(0);

    expect(
      queryByTestId("t--status-change-DATASOURCES"),
    ).not.toBeInTheDocument();
    expect(queryByTestId("t--status-change-JSLIBS")).not.toBeInTheDocument();
    expect(
      queryByTestId("t--status-change-REMOTE_AHEAD"),
    ).not.toBeInTheDocument();
    expect(
      queryByTestId("t--status-change-REMOTE_BEHIND"),
    ).not.toBeInTheDocument();
    expect(queryByTestId("t--status-change-PACKAGES")).not.toBeInTheDocument();
    expect(queryByTestId("t--status-change-MODULES")).not.toBeInTheDocument();
    expect(queryByTestId("t--status-change-SETTINGS")).not.toBeInTheDocument();
    expect(queryByTestId("t--status-change-THEME")).not.toBeInTheDocument();
  });

  it("should render JSObject related changes", () => {
    const store = getMockStore({
      gitStatus: {
        jsObjectsModified: ["Page1/JSObject1", "Page2/JSObject2"],
        jsObjectsAdded: ["Page1/JSObject3"],
        jsObjectsRemoved: ["Page1/JSObject4"],
      },
    });

    const { getByTestId, queryByTestId } = render(
      <Provider store={store}>
        <GitChangesList />
      </Provider>,
    );

    const page1 = getByTestId("t--status-change-PAGE-Page1");
    const page2 = getByTestId("t--status-change-PAGE-Page2");

    expect(page1).toBeInTheDocument();
    expect(page2).toBeInTheDocument();

    page1.click();
    page2.click();

    expect(
      page1.querySelectorAll("[data-testid=t--status-change-JSOBJECTS]").length,
    ).toBeGreaterThan(0);

    expect(
      page2.querySelectorAll("[data-testid=t--status-change-JSOBJECTS]").length,
    ).toBeGreaterThan(0);

    expect(
      queryByTestId("t--status-change-DATASOURCES"),
    ).not.toBeInTheDocument();
    expect(queryByTestId("t--status-change-JSLIBS")).not.toBeInTheDocument();
    expect(
      queryByTestId("t--status-change-REMOTE_AHEAD"),
    ).not.toBeInTheDocument();
    expect(
      queryByTestId("t--status-change-REMOTE_BEHIND"),
    ).not.toBeInTheDocument();
    expect(queryByTestId("t--status-change-PACKAGES")).not.toBeInTheDocument();
    expect(queryByTestId("t--status-change-MODULES")).not.toBeInTheDocument();
    expect(queryByTestId("t--status-change-SETTINGS")).not.toBeInTheDocument();
    expect(queryByTestId("t--status-change-THEME")).not.toBeInTheDocument();
  });

  it("should render JSLib related changes", () => {
    const store = getMockStore({
      gitStatus: {
        jsLibsModified: ["JSLib 1", "JSLib 2"],
        jsLibsAdded: ["JSLib 3"],
        jsLibsRemoved: ["JSLib 4"],
      },
    });

    const { getByTestId, queryByTestId } = render(
      <Provider store={store}>
        <GitChangesList />
      </Provider>,
    );

    expect(
      queryByTestId("t--status-change-DATASOURCES"),
    ).not.toBeInTheDocument();
    expect(getByTestId("t--status-change-JSLIBS")).toBeInTheDocument();
    expect(
      queryByTestId("t--status-change-REMOTE_AHEAD"),
    ).not.toBeInTheDocument();
    expect(
      queryByTestId("t--status-change-REMOTE_BEHIND"),
    ).not.toBeInTheDocument();
    expect(queryByTestId("t--status-change-PACKAGES")).not.toBeInTheDocument();
    expect(queryByTestId("t--status-change-MODULES")).not.toBeInTheDocument();
    expect(queryByTestId("t--status-change-SETTINGS")).not.toBeInTheDocument();
    expect(queryByTestId("t--status-change-THEME")).not.toBeInTheDocument();
  });

  it("should render Remote related changes", () => {
    const store = getMockStore({
      gitStatus: {
        aheadCount: 2,
        behindCount: 3,
      },
    });

    const { getByTestId, queryByTestId } = render(
      <Provider store={store}>
        <GitChangesList />
      </Provider>,
    );

    expect(
      queryByTestId("t--status-change-DATASOURCES"),
    ).not.toBeInTheDocument();
    expect(queryByTestId("t--status-change-JSLIBS")).not.toBeInTheDocument();
    expect(getByTestId("t--status-change-REMOTE_AHEAD")).toBeInTheDocument();
    expect(getByTestId("t--status-change-REMOTE_BEHIND")).toBeInTheDocument();
    expect(queryByTestId("t--status-change-PACKAGES")).not.toBeInTheDocument();
    expect(queryByTestId("t--status-change-MODULES")).not.toBeInTheDocument();
    expect(queryByTestId("t--status-change-SETTINGS")).not.toBeInTheDocument();
    expect(queryByTestId("t--status-change-THEME")).not.toBeInTheDocument();
  });

  it("should render Theme and Settings related changes", () => {
    const store = getMockStore({
      gitStatus: {
        modified: ["theme.json", "application.json"],
      },
    });

    const { getByTestId, queryByTestId } = render(
      <Provider store={store}>
        <GitChangesList />
      </Provider>,
    );

    expect(
      queryByTestId("t--status-change-DATASOURCES"),
    ).not.toBeInTheDocument();
    expect(queryByTestId("t--status-change-JSLIBS")).not.toBeInTheDocument();
    expect(
      queryByTestId("t--status-change-REMOTE_AHEAD"),
    ).not.toBeInTheDocument();
    expect(
      queryByTestId("t--status-change-REMOTE_BEHIND"),
    ).not.toBeInTheDocument();
    expect(queryByTestId("t--status-change-PACKAGES")).not.toBeInTheDocument();
    expect(queryByTestId("t--status-change-MODULES")).not.toBeInTheDocument();
    expect(getByTestId("t--status-change-SETTINGS")).toBeInTheDocument();
    expect(getByTestId("t--status-change-THEME")).toBeInTheDocument();
  });

  it("should render Module related changes", () => {
    const store = getMockStore({
      gitStatus: {
        modifiedSourceModules: 2,
      },
    });

    const { getByTestId, queryByTestId } = render(
      <Provider store={store}>
        <GitChangesList />
      </Provider>,
    );

    expect(
      queryByTestId("t--status-change-DATASOURCES"),
    ).not.toBeInTheDocument();
    expect(queryByTestId("t--status-change-JSLIBS")).not.toBeInTheDocument();
    expect(
      queryByTestId("t--status-change-REMOTE_AHEAD"),
    ).not.toBeInTheDocument();
    expect(
      queryByTestId("t--status-change-REMOTE_BEHIND"),
    ).not.toBeInTheDocument();
    expect(queryByTestId("t--status-change-PACKAGES")).not.toBeInTheDocument();
    expect(getByTestId("t--status-change-MODULES")).toBeInTheDocument();
    expect(queryByTestId("t--status-change-SETTINGS")).not.toBeInTheDocument();
    expect(queryByTestId("t--status-change-THEME")).not.toBeInTheDocument();
  });
});
