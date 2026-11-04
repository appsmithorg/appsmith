import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { renderHook } from "@testing-library/react-hooks";
import "@testing-library/jest-dom";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import configureStore from "redux-mock-store";
import { ThemeProvider } from "styled-components";
import { lightTheme } from "selectors/themeSelectors";
import store from "store";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { PluginPackageName, PluginType } from "entities/Plugin";
import { getHasDeleteActionPermission } from "ee/utils/BusinessFeatures/permissionPageHelpers";
import {
  AppsmithAIQueriesCallout,
  useShowAppsmithAIQueriesCallout,
} from "./AppsmithAIQueriesCallout";

jest.mock("ee/utils/BusinessFeatures/permissionPageHelpers", () => ({
  ...jest.requireActual("ee/utils/BusinessFeatures/permissionPageHelpers"),
  getHasDeleteActionPermission: jest.fn(() => true),
}));

const dispatch = jest.fn();

jest.mock("react-redux", () => ({
  ...jest.requireActual("react-redux"),
  useDispatch: () => dispatch,
}));

const plugins = [
  {
    id: "ai-plugin",
    name: "Appsmith AI",
    packageName: PluginPackageName.APPSMITH_AI,
    type: PluginType.AI,
  },
  {
    id: "pg-plugin",
    name: "PostgreSQL",
    packageName: PluginPackageName.POSTGRES,
    type: PluginType.DB,
  },
];

const pages = [
  { pageId: "page-1", pageName: "Home" },
  { pageId: "page-2", pageName: "Reports" },
];

const makeAction = (
  id: string,
  pluginId: string,
  datasource: Record<string, unknown>,
  pageId = "page-1",
  userPermissions: string[] = [],
) => ({
  isLoading: false,
  config: { id, name: id, pageId, pluginId, datasource, userPermissions },
});

const aiActions = [
  // Two queries share one stored Appsmith AI datasource.
  makeAction("Summarise", "ai-plugin", { id: "ds-ai" }),
  makeAction("Translate", "ai-plugin", { id: "ds-ai" }, "page-2"),
  // Embedded default datasource: nothing to delete there.
  makeAction("Classify", "ai-plugin", { name: "DEFAULT_APPSMITH_AI" }),
];
const pgAction = makeAction("Users", "pg-plugin", { id: "ds-pg" });

const makeStore = ({
  actions = [...aiActions, pgAction],
  isPreviewMode = false,
  isProtectedBranch = false,
}: {
  actions?: unknown[];
  isPreviewMode?: boolean;
  isProtectedBranch?: boolean;
} = {}) => {
  const initialState = store.getState();

  return configureStore([])({
    ...initialState,
    entities: {
      ...initialState.entities,
      plugins: { ...initialState.entities.plugins, list: plugins },
      pageList: { ...initialState.entities.pageList, pages },
      actions,
    },
    ui: {
      ...initialState.ui,
      editor: { ...initialState.ui.editor, isPreviewMode },
      applications: {
        ...initialState.ui.applications,
        currentApplication: {
          ...initialState.ui.applications.currentApplication,
          gitApplicationMetadata: isProtectedBranch
            ? { branchName: "main", remoteUrl: "remote-url" }
            : undefined,
        },
      },
      gitSync: {
        ...initialState.ui.gitSync,
        protectedBranches: isProtectedBranch ? ["main"] : [],
      },
    },
  });
};

const renderCallout = (
  mockStore = makeStore(),
  onHeightChange?: (height: number) => void,
) =>
  render(
    <Provider store={mockStore}>
      <BrowserRouter>
        <ThemeProvider theme={lightTheme}>
          <AppsmithAIQueriesCallout onHeightChange={onHeightChange} />
        </ThemeProvider>
      </BrowserRouter>
    </Provider>,
  );

const confirmDelete = () => {
  fireEvent.click(screen.getByTestId("t--appsmith-ai-queries-delete-cta"));
  fireEvent.click(screen.getByTestId("t--appsmith-ai-queries-delete-confirm"));
};

describe("AppsmithAIQueriesCallout", () => {
  beforeEach(() => {
    dispatch.mockClear();
    (getHasDeleteActionPermission as jest.Mock).mockReturnValue(true);
  });

  it("counts Appsmith AI queries on every page and offers to delete them", () => {
    renderCallout();

    expect(
      screen.getByText(/3 Appsmith AI queries in this app stopped working/),
    ).toBeInTheDocument();
    expect(screen.getByText(/They no longer appear/)).toBeInTheDocument();
    expect(
      screen.getByTestId("t--appsmith-ai-queries-delete-cta"),
    ).toHaveTextContent("Delete 3 queries");
    expect(
      screen.getByTestId("t--appsmith-ai-queries-learn-cta"),
    ).toBeInTheDocument();
  });

  it("uses singular copy for one query", () => {
    renderCallout(makeStore({ actions: [aiActions[0], pgAction] }));

    expect(
      screen.getByText(/1 Appsmith AI query in this app stopped working/),
    ).toBeInTheDocument();
    expect(screen.getByText(/It no longer appears/)).toBeInTheDocument();
    expect(
      screen.getByTestId("t--appsmith-ai-queries-delete-cta"),
    ).toHaveTextContent("Delete 1 query");
  });

  it("deletes only after the developer confirms, and lists each query with its page", () => {
    renderCallout();

    fireEvent.click(screen.getByTestId("t--appsmith-ai-queries-delete-cta"));

    expect(dispatch).not.toHaveBeenCalled();
    expect(
      screen.getByText("Delete 3 Appsmith AI queries?"),
    ).toBeInTheDocument();
    expect(screen.getByText("Summarise · Home")).toBeInTheDocument();
    expect(screen.getByText("Translate · Reports")).toBeInTheDocument();
    expect(screen.getByText(/You can't undo this/)).toBeInTheDocument();

    fireEvent.click(
      screen.getByTestId("t--appsmith-ai-queries-delete-confirm"),
    );

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch.mock.calls[0][0]).toEqual({
      type: ReduxActionTypes.DELETE_HIDDEN_PLUGIN_ACTIONS_INIT,
      payload: {
        actions: [
          { id: "Summarise", name: "Summarise" },
          { id: "Translate", name: "Translate" },
          { id: "Classify", name: "Classify" },
        ],
        // The shared datasource once; no embedded or Postgres datasource.
        datasourceIds: ["ds-ai"],
        onComplete: expect.any(Function),
      },
    });
  });

  it("deletes only the queries the developer may delete", () => {
    (getHasDeleteActionPermission as jest.Mock).mockImplementation(
      (_isEnabled: boolean, permissions?: string[]) =>
        Boolean(permissions?.includes("delete:actions")),
    );
    renderCallout(
      makeStore({
        actions: [
          makeAction("Mine", "ai-plugin", { id: "ds-mine" }, "page-1", [
            "delete:actions",
          ]),
          makeAction("Theirs", "ai-plugin", { id: "ds-theirs" }),
          pgAction,
        ],
      }),
    );

    expect(
      screen.getByTestId("t--appsmith-ai-queries-delete-cta"),
    ).toHaveTextContent("Delete 1 query");

    fireEvent.click(screen.getByTestId("t--appsmith-ai-queries-delete-cta"));
    expect(screen.getByText(/You can delete 1 of 2/)).toBeInTheDocument();

    fireEvent.click(
      screen.getByTestId("t--appsmith-ai-queries-delete-confirm"),
    );

    expect(dispatch.mock.calls[0][0].payload).toMatchObject({
      actions: [{ id: "Mine", name: "Mine" }],
      datasourceIds: ["ds-mine"],
    });
  });

  it("does not offer deletion when the developer may not delete any query", () => {
    (getHasDeleteActionPermission as jest.Mock).mockReturnValue(false);
    renderCallout();

    expect(
      screen.queryByTestId("t--appsmith-ai-queries-delete-cta"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/Ask a developer who can delete queries to delete them/),
    ).toBeInTheDocument();
  });

  it("closes the modal when the delete finishes", () => {
    renderCallout();
    confirmDelete();

    const { onComplete } = dispatch.mock.calls[0][0].payload;

    expect(
      screen.getByTestId("t--appsmith-ai-queries-delete-modal"),
    ).toBeInTheDocument();

    onComplete(3);

    expect(
      screen.queryByTestId("t--appsmith-ai-queries-delete-modal"),
    ).not.toBeInTheDocument();
  });

  it("ignores the delete result after the banner unmounts", () => {
    // The banner unmounts once no Appsmith AI query is left, which can happen
    // before the saga finishes. React 17 warns on state updates after unmount.
    const consoleError = jest.spyOn(console, "error").mockImplementation();
    const { unmount } = renderCallout();

    confirmDelete();
    const { onComplete } = dispatch.mock.calls[0][0].payload;

    unmount();
    onComplete(3);

    expect(
      consoleError.mock.calls.some((args) =>
        String(args[0]).includes("unmounted component"),
      ),
    ).toBe(false);
    consoleError.mockRestore();
  });

  it("reports its height to the layout, and 0 when it unmounts", () => {
    const onHeightChange = jest.fn();
    const { unmount } = renderCallout(makeStore(), onHeightChange);

    expect(onHeightChange).toHaveBeenCalled();

    unmount();

    expect(onHeightChange).toHaveBeenLastCalledWith(0);
  });

  it("renders nothing when the app has no Appsmith AI queries", () => {
    renderCallout(makeStore({ actions: [pgAction] }));

    expect(
      screen.queryByTestId("t--appsmith-ai-queries-callout"),
    ).not.toBeInTheDocument();
  });
});

describe("useShowAppsmithAIQueriesCallout", () => {
  const renderShow = (mockStore: ReturnType<typeof makeStore>) =>
    renderHook(() => useShowAppsmithAIQueriesCallout(), {
      wrapper: ({ children }) => (
        <Provider store={mockStore}>{children}</Provider>
      ),
    }).result.current;

  it("is true in the editor when Appsmith AI queries exist", () => {
    expect(renderShow(makeStore())).toBe(true);
  });

  it("is false in preview mode", () => {
    expect(renderShow(makeStore({ isPreviewMode: true }))).toBe(false);
  });

  it("is false on a protected git branch, where nothing can be deleted", () => {
    expect(renderShow(makeStore({ isProtectedBranch: true }))).toBe(false);
  });

  it("is false when there are no Appsmith AI queries", () => {
    expect(renderShow(makeStore({ actions: [pgAction] }))).toBe(false);
  });
});
