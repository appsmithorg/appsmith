import React from "react";
import { Route } from "react-router-dom";
import { render } from "test/testUtils";
import IDE from "pages/Editor/IDE/index";
import { createMessage, EDITOR_PANE_TEXTS } from "@appsmith/constants/messages";
import { BUILDER_PATH } from "@appsmith/constants/routes/appRoutes";
import store from "store";
import {
  EditorEntityTab,
  EditorViewMode,
} from "@appsmith/entities/IDE/constants";
import { APIFactory } from "test/factories/Actions/API";
import localStorage from "utils/localStorage";

/**
 * In Full screen
 *   - List state is shown with item selected
 *   - Add state is shown with item not selected
 * In Side by side, list is not shown and add state is shown in the same place
 *
 */

describe("IDE URL rendering of Queries", () => {
  localStorage.setItem("SPLITPANE_ANNOUNCEMENT", "false");
  describe("Query Blank State", () => {
    it("Renders Fullscreen Blank State", () => {
      const { getByRole, getByText } = render(
        <Route path={BUILDER_PATH}>
          <IDE />
        </Route>,
        {
          url: "/app/applicationSlug/pageSlug-page_id/edit/queries",
          featureFlags: {
            rollout_side_by_side_enabled: true,
            rollout_editor_pane_segments_enabled: true,
          },
        },
      );

      // Main pane text
      getByText(createMessage(EDITOR_PANE_TEXTS.query_blank_state));

      // Left pane text
      getByText(createMessage(EDITOR_PANE_TEXTS.query_blank_state_description));

      // CTA button is rendered
      getByRole("button", { name: "New query / API" });
    });

    it("Renders Split Screen Blank State", () => {
      const state = store.getState();
      const { getByTestId, getByText } = render(
        <Route path={BUILDER_PATH}>
          <IDE />
        </Route>,
        {
          url: "/app/applicationSlug/pageSlug-page_id/edit/queries",
          initialState: {
            ...state,
            ui: {
              ...state.ui,
              ide: {
                ...state.ui.ide,
                view: EditorViewMode.SplitScreen,
              },
            },
          },
          featureFlags: {
            rollout_side_by_side_enabled: true,
            rollout_editor_pane_segments_enabled: true,
          },
        },
      );

      // Check if editor is in split screen
      getByTestId("t--ide-maximize");
      getByTestId("t--widgets-editor");

      // Left pane text
      getByText(createMessage(EDITOR_PANE_TEXTS.query_blank_state_description));

      // CTA button is rendered
      getByText(/new query \/ api/i);
    });

    it("Renders Fullscreen Add in Blank State", () => {
      const { getByRole, getByText } = render(
        <Route path={BUILDER_PATH}>
          <IDE />
        </Route>,
        {
          url: "/app/applicationSlug/pageSlug-page_id/edit/queries/add",
          featureFlags: {
            rollout_side_by_side_enabled: true,
            rollout_editor_pane_segments_enabled: true,
          },
        },
      );

      // Main pane text
      getByText(createMessage(EDITOR_PANE_TEXTS.query_blank_state));

      // Left pane header
      getByText(createMessage(EDITOR_PANE_TEXTS.query_create_tab_title));

      // Create options are rendered
      getByText(createMessage(EDITOR_PANE_TEXTS.queries_create_from_existing));
      getByText("New datasource");
      getByText("REST API");
      // Close button is rendered
      getByRole("button", { name: "Close pane" });
    });

    it("Renders Split Screen Add in Blank State", () => {
      const state = store.getState();
      const { getByRole, getByTestId, getByText } = render(
        <Route path={BUILDER_PATH}>
          <IDE />
        </Route>,
        {
          url: "/app/applicationSlug/pageSlug-page_id/edit/queries/add",
          initialState: {
            ...state,
            ui: {
              ...state.ui,
              ide: {
                ...state.ui.ide,
                view: EditorViewMode.SplitScreen,
              },
            },
          },
          featureFlags: {
            rollout_side_by_side_enabled: true,
            rollout_editor_pane_segments_enabled: true,
          },
        },
      );

      // Check if editor is in split screen
      getByTestId("t--ide-maximize");
      getByTestId("t--widgets-editor");

      // Left pane header
      getByText(createMessage(EDITOR_PANE_TEXTS.query_create_tab_title));

      // Create options are rendered
      getByText(createMessage(EDITOR_PANE_TEXTS.queries_create_from_existing));
      getByText("New datasource");
      getByText("REST API");
      // Close button is rendered
      getByRole("button", { name: "Close pane" });
    });
  });

  describe("API Routes", () => {
    it("Renders Api routes in Full screen", () => {
      const state = store.getState();
      const anApi = APIFactory.build({ id: "api_id", pageId: "page_id" });
      const pageList = {
        pages: [
          {
            pageName: "Page1",
            pageId: "page_id",
            isDefault: true,
            isHidden: false,
            slug: "pageSlug",
            userPermissions: [
              "create:moduleInstancesInPage",
              "read:pages",
              "manage:pages",
              "create:pageActions",
              "delete:pages",
            ],
          },
        ],
        isGeneratingTemplatePage: false,
        applicationId: "655716e035e2c9432e4bd94b",
        currentPageId: "page_id",
        defaultPageId: "page_id",
        loading: {},
      };

      const plugins = [
        {
          id: anApi.pluginId,
          userPermissions: [],
          name: "REST API",
          type: "API",
          packageName: "restapi-plugin",
          iconLocation: "https://assets.appsmith.com/RestAPI.png",
          uiComponent: "ApiEditorForm",
          datasourceComponent: "RestAPIDatasourceForm",
          allowUserDatasources: true,
          isRemotePlugin: false,
          templates: {},
          remotePlugin: false,
          new: false,
        },
      ];

      const { getAllByText, getByRole, getByTestId } = render(
        <Route path={BUILDER_PATH}>
          <IDE />
        </Route>,
        {
          url: "/app/applicationSlug/pageSlug-page_id/edit/api/api_id",
          initialState: {
            ...state,
            entities: {
              ...state.entities,
              pageList,
              actions: [
                ...state.entities.actions,
                { isLoading: false, config: anApi, data: undefined },
              ],
              plugins: {
                ...state.entities.plugins,
                list: plugins,
              },
            },
            ui: {
              ...state.ui,
              ide: {
                ...state.ui.ide,
                tabs: {
                  ...state.ui.ide.tabs,
                  [EditorEntityTab.QUERIES]: ["api_id"],
                },
              },
              editor: {
                ...state.ui.editor,
                initialized: true,
              },
            },
          },
          featureFlags: {
            rollout_side_by_side_enabled: true,
            rollout_editor_pane_segments_enabled: true,
          },
        },
      );

      // There will be 3 Api1 text (Left pane list, editor tab and Editor form)
      expect(getAllByText("Api1").length).toEqual(3);
      // Left pane active state
      expect(
        getByTestId("t--entity-item-Api1").classList.contains("active"),
      ).toBe(true);
      // Tabs active state
      expect(getByTestId("t--ide-tab-Api1").classList.contains("active")).toBe(
        true,
      );
      // Check if the form is rendered
      getByTestId("t--action-form-API");
      // Check if the params tabs is visible
      getByRole("tab", { name: /params/i });
      // Check if run button is visible
      getByRole("button", { name: /run/i });
      // Check if the Add new button is shown
      getByRole("button", { name: "New query / API" });
    });

    it("Renders Api routes in Split Screen", async () => {
      const state = store.getState();
      const anApi = APIFactory.build({ id: "api_id2", pageId: "page_id" });
      const pageList = {
        pages: [
          {
            pageName: "Page1",
            pageId: "page_id",
            isDefault: true,
            isHidden: false,
            slug: "pageSlug",
            userPermissions: [
              "create:moduleInstancesInPage",
              "read:pages",
              "manage:pages",
              "create:pageActions",
              "delete:pages",
            ],
          },
        ],
        isGeneratingTemplatePage: false,
        applicationId: "655716e035e2c9432e4bd94b",
        currentPageId: "page_id",
        defaultPageId: "page_id",
        loading: {},
      };

      const plugins = [
        {
          id: anApi.pluginId,
          userPermissions: [],
          name: "REST API",
          type: "API",
          packageName: "restapi-plugin",
          iconLocation: "https://assets.appsmith.com/RestAPI.png",
          uiComponent: "ApiEditorForm",
          datasourceComponent: "RestAPIDatasourceForm",
          allowUserDatasources: true,
          isRemotePlugin: false,
          templates: {},
          remotePlugin: false,
          new: false,
        },
      ];

      const { getAllByText, getByRole, getByTestId } = render(
        <Route path={BUILDER_PATH}>
          <IDE />
        </Route>,
        {
          url: "/app/applicationSlug/pageSlug-page_id/edit/api/api_id2",
          initialState: {
            ...state,
            entities: {
              ...state.entities,
              pageList,
              actions: [
                ...state.entities.actions,
                { isLoading: false, config: anApi, data: undefined },
              ],
              plugins: {
                ...state.entities.plugins,
                list: plugins,
              },
            },
            ui: {
              ...state.ui,
              ide: {
                ...state.ui.ide,
                tabs: {
                  ...state.ui.ide.tabs,
                  [EditorEntityTab.QUERIES]: ["api_id2"],
                },
                view: EditorViewMode.SplitScreen,
              },
              editor: {
                ...state.ui.editor,
                initialized: true,
              },
            },
          },
          featureFlags: {
            rollout_side_by_side_enabled: true,
            rollout_editor_pane_segments_enabled: true,
          },
        },
      );

      // Check if editor is in split screen
      getByTestId("t--ide-maximize");
      getByTestId("t--widgets-editor");

      // Check if api is rendered in side by side
      expect(getAllByText("Api2").length).toBe(2);
      // Tabs active state
      expect(getByTestId("t--ide-tab-Api2").classList.contains("active")).toBe(
        true,
      );
      // Check if the form is rendered
      getByTestId("t--action-form-API");
      // Check if run button is visible
      getByRole("button", { name: /run/i });
      // Check if the Add new button is shown
      getByTestId("t--ide-split-screen-add-button");
    });

    it.todo("Renders Api add routes in Full Screen");
    it.todo("Renders Api add routes in Split Screen");
  });

  describe("Postgres Routes", () => {
    it.todo("Renders Postgres routes in Full Screen");
    it.todo("Renders Postgres routes in Split screen");
    it.todo("Renders Postgres add routes in Full Screen");
    it.todo("Renders Postgres add routes in Split Screen");
  });

  describe("Mongo Routes", () => {
    it.todo("Renders Mongo routes in Full Screen");
    it.todo("Renders Mongo routes in Split screen");
    it.todo("Renders Mongo add routes in Full Screen");
    it.todo("Renders Mongo add routes in Split Screen");
  });

  describe("Google Sheets Routes", () => {
    it.todo("Renders Google Sheets routes in Full Screen");
    it.todo("Renders Google Sheets routes in Split screen");
    it.todo("Renders Google Sheets add routes in Full Screen");
    it.todo("Renders Google Sheets add routes in Split Screen");
  });
});
