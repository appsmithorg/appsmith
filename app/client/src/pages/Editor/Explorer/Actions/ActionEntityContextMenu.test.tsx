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
import { FilesContextProvider } from "../Files/FilesContextProvider";
import { ActionParentEntityType } from "ee/entities/Engine/actionHelpers";
import { act } from "react-dom/test-utils";
import {
  CONTEXT_COPY,
  CONTEXT_DELETE,
  CONTEXT_MOVE,
  CONTEXT_RENAME,
  CONTEXT_SHOW_BINDING,
  createMessage,
} from "ee/constants/messages";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { type ReduxAction } from "actions/ReduxActionTypes";

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

    // In context of pages, the copy to page option will be shown
    const copyQueryToPageOptions = await findByText(
      createMessage(CONTEXT_COPY),
    );

    expect(await findByText(createMessage(CONTEXT_RENAME))).toBeInTheDocument();
    expect(await findByText(createMessage(CONTEXT_DELETE))).toBeInTheDocument();
    expect(await findByText(createMessage(CONTEXT_MOVE))).toBeInTheDocument();
    expect(
      await findByText(createMessage(CONTEXT_SHOW_BINDING)),
    ).toBeInTheDocument();
    expect(copyQueryToPageOptions).toBeInTheDocument();

    // Now we click on the copy to page option
    act(() => {
      fireEvent.click(copyQueryToPageOptions);
    });

    // Now a menu with the list of pages will show up
    const copyQueryToPageSubOptionPage1 = await findByText("Page1");

    expect(copyQueryToPageSubOptionPage1).toBeInTheDocument();
    expect(await findByText("Page2")).toBeInTheDocument();

    // Clicking on the page will trigger the correct action
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
  // TODO: add tests for all options rendered in the context menu
});
