import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import { Provider } from "react-redux";
import { lightTheme } from "selectors/themeSelectors";
import { ThemeProvider } from "styled-components";
import configureStore from "redux-mock-store";
import { PluginType } from "entities/Action";
import {
  ActionEntityContextMenu,
  type EntityContextMenuProps,
} from "./ActionEntityContextMenu";
import {
  ActionEntityContextMenuItemsEnum,
  FilesContextProvider,
} from "../Files/FilesContextProvider";
import { ActionParentEntityType } from "ee/entities/Engine/actionHelpers";
import { act } from "react-dom/test-utils";
import {
  CONTEXT_COPY,
  CONTEXT_DELETE,
  CONTEXT_DUPLICATE,
  CONTEXT_RENAME,
  createMessage,
} from "ee/constants/messages";
import {
  ReduxActionTypes,
  type ReduxAction,
} from "ee/constants/ReduxActionConstants";

const mockStore = configureStore([]);

const page1Id = "605c435a91dea93f0eaf91ba";
const page2Id = "605c435a91dea93f0eaf91bc";
const basePage2Id = "605c435a91dea93f0eaf91bc";
const defaultState = {
  ui: {
    selectedWorkspace: {
      workspace: {},
    },
    workspaces: {
      packagesList: [],
    },
    users: {
      featureFlag: {
        data: {},
      },
    },
  },
  entities: {
    actions: [],
    pageList: {
      pages: [
        {
          pageId: page1Id,
          basePageId: page2Id,
          pageName: "Page1",
          isDefault: true,
          slug: "page-1",
        },
        {
          pageId: page2Id,
          basePageId: basePage2Id,
          pageName: "Page2",
          isDefault: false,
          slug: "page-2",
        },
      ],
    },
  },
};

const defaultProps: EntityContextMenuProps = {
  id: "test-action-id",
  name: "test-action",
  canManageAction: true,
  canDeleteAction: true,
  pluginType: PluginType.DB,
};

const defaultContext = {
  editorId: "test-editor-id",
  canCreateActions: true,
  menuItems: [
    ActionEntityContextMenuItemsEnum.RENAME,
    ActionEntityContextMenuItemsEnum.COPY,
    ActionEntityContextMenuItemsEnum.DELETE,
  ],
  parentEntityId: "test-parent-entity-id",
  parentEntityType: ActionParentEntityType.PAGE,
};

describe("ActionEntityContextMenu", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let store: any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders context menu with correct options for application editor", async () => {
    store = mockStore(defaultState);
    const { findByText, getByRole } = render(
      <Provider store={store}>
        <ThemeProvider theme={lightTheme}>
          <FilesContextProvider {...defaultContext}>
            <ActionEntityContextMenu {...defaultProps} />
          </FilesContextProvider>
        </ThemeProvider>
      </Provider>,
    );
    const triggerToOpenMenu = getByRole("button");

    act(() => {
      fireEvent.click(triggerToOpenMenu);
    });

    await waitFor(() => {
      expect(triggerToOpenMenu.parentNode).toHaveAttribute(
        "aria-expanded",
        "true",
      );
    });
    const copyQueryToPageOptions = await findByText(
      createMessage(CONTEXT_COPY),
    );

    expect(await findByText(createMessage(CONTEXT_RENAME))).toBeInTheDocument();
    expect(await findByText(createMessage(CONTEXT_DELETE))).toBeInTheDocument();
    expect(copyQueryToPageOptions).toBeInTheDocument();
    act(() => {
      fireEvent.click(copyQueryToPageOptions);
    });

    const copyQueryToPageSubOptionPage1 = await findByText("Page1");

    expect(copyQueryToPageSubOptionPage1).toBeInTheDocument();
    expect(await findByText("Page2")).toBeInTheDocument();
    act(() => {
      fireEvent.click(copyQueryToPageSubOptionPage1);
    });

    let actions: Array<
      ReduxAction<{
        payload: {
          id: string;
          destinationEntityId: string;
          name: string;
        };
      }>
    > = [];

    await waitFor(() => {
      actions = store.getActions();
    });

    expect(actions.length).toBe(1);
    expect(actions[0].type).toBe(ReduxActionTypes.COPY_ACTION_INIT);
    expect(actions[0].payload).toEqual({
      destinationEntityId: page1Id,
      id: "test-action-id",
      name: "test-action",
    });
  });

  it("renders context menu with correct options for workflows editor", async () => {
    const workflowsEditorContext = {
      ...defaultContext,
      parentEntityType: ActionParentEntityType.WORKFLOW,
    };

    store = mockStore(defaultState);
    const { findByText, getByRole } = render(
      <Provider store={store}>
        <ThemeProvider theme={lightTheme}>
          <FilesContextProvider {...workflowsEditorContext}>
            <ActionEntityContextMenu {...defaultProps} />
          </FilesContextProvider>
        </ThemeProvider>
      </Provider>,
    );
    const triggerToOpenMenu = getByRole("button");

    act(() => {
      fireEvent.click(triggerToOpenMenu);
    });

    await waitFor(() => {
      expect(triggerToOpenMenu.parentNode).toHaveAttribute(
        "aria-expanded",
        "true",
      );
    });

    const duplicateQueryOption = await findByText(
      createMessage(CONTEXT_DUPLICATE),
    );

    expect(await findByText(createMessage(CONTEXT_RENAME))).toBeInTheDocument();
    expect(await findByText(createMessage(CONTEXT_DELETE))).toBeInTheDocument();
    expect(duplicateQueryOption).toBeInTheDocument();
    act(() => {
      fireEvent.click(duplicateQueryOption);
    });
    let actions: Array<
      ReduxAction<{
        payload: {
          id: string;
          destinationEntityId: string;
          name: string;
        };
      }>
    > = [];

    await waitFor(() => {
      actions = store.getActions();
    });

    expect(actions.length).toBe(1);
    expect(actions[0].type).toBe(ReduxActionTypes.COPY_ACTION_INIT);
    expect(actions[0].payload).toEqual({
      destinationEntityId: "test-parent-entity-id",
      id: "test-action-id",
      name: "test-action",
    });
  });
  // TODO: add tests for all options rendered in the context menu
});
