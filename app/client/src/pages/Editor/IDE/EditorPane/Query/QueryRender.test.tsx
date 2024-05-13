import React from "react";
import { Route } from "react-router-dom";
import { render } from "test/testUtils";
import IDE from "pages/Editor/IDE/index";
import { createMessage, EDITOR_PANE_TEXTS } from "@appsmith/constants/messages";
import { BUILDER_PATH } from "@appsmith/constants/routes/appRoutes";
import {
  EditorEntityTab,
  EditorViewMode,
} from "@appsmith/entities/IDE/constants";
import { APIFactory } from "test/factories/Actions/API";
import localStorage from "utils/localStorage";
import { PostgresFactory } from "test/factories/Actions/Postgres";
import { sagasToRunForTests } from "test/sagas";
import userEvent from "@testing-library/user-event";
import { getIDETestState } from "test/factories/AppIDEFactoryUtils";
import { PageFactory } from "test/factories/PageFactory";
import { screen } from "@testing-library/react";
import { GoogleSheetFactory } from "test/factories/Actions/GoogleSheetFactory";

const FeatureFlags = {
  rollout_side_by_side_enabled: true,
};

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
          featureFlags: FeatureFlags,
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
      const state = getIDETestState({ ideView: EditorViewMode.SplitScreen });
      const { getByTestId, getByText } = render(
        <Route path={BUILDER_PATH}>
          <IDE />
        </Route>,
        {
          url: "/app/applicationSlug/pageSlug-page_id/edit/queries",
          initialState: state,
          featureFlags: FeatureFlags,
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
      const { getByTestId, getByText } = render(
        <Route path={BUILDER_PATH}>
          <IDE />
        </Route>,
        {
          url: "/app/applicationSlug/pageSlug-page_id/edit/queries/add",
          featureFlags: FeatureFlags,
        },
      );

      // Create options are rendered
      getByText(createMessage(EDITOR_PANE_TEXTS.queries_create_from_existing));
      getByText("New datasource");
      getByText("REST API");
      // Check new tab presence
      const newTab = getByTestId("t--ide-tab-new");
      expect(newTab).not.toBeNull();
      // Close button is rendered
      expect(
        newTab.querySelector("[data-testid='t--tab-close-btn']"),
      ).not.toBeNull();
    });

    it("Renders Split Screen Add in Blank State", () => {
      const state = getIDETestState({ ideView: EditorViewMode.SplitScreen });
      const { getByTestId, getByText } = render(
        <Route path={BUILDER_PATH}>
          <IDE />
        </Route>,
        {
          url: "/app/applicationSlug/pageSlug-page_id/edit/queries/add",
          initialState: state,
          featureFlags: FeatureFlags,
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
      // Check new tab presence
      const newTab = getByTestId("t--ide-tab-new");
      expect(newTab).not.toBeNull();
      // Close button is rendered
      expect(
        newTab.querySelector("[data-testid='t--tab-close-btn']"),
      ).not.toBeNull();
    });
  });

  describe("API Routes", () => {
    it("Renders Api routes in Full screen", () => {
      const page = PageFactory.build();
      const anApi = APIFactory.build({ id: "api_id", pageId: page.pageId });
      const state = getIDETestState({
        pages: [page],
        actions: [anApi],
        tabs: {
          [EditorEntityTab.QUERIES]: ["api_id"],
          [EditorEntityTab.JS]: [],
        },
      });

      const { getAllByText, getByRole, getByTestId } = render(
        <Route path={BUILDER_PATH}>
          <IDE />
        </Route>,
        {
          url: "/app/applicationSlug/pageSlug-page_id/edit/api/api_id",
          initialState: state,
          featureFlags: FeatureFlags,
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
      const page = PageFactory.build();
      const anApi = APIFactory.build({ id: "api_id2", pageId: page.pageId });
      const state = getIDETestState({
        actions: [anApi],
        pages: [page],
        tabs: {
          [EditorEntityTab.QUERIES]: ["api_id2"],
          [EditorEntityTab.JS]: [],
        },
        ideView: EditorViewMode.SplitScreen,
      });

      const { getAllByText, getByRole, getByTestId } = render(
        <Route path={BUILDER_PATH}>
          <IDE />
        </Route>,
        {
          url: "/app/applicationSlug/pageSlug-page_id/edit/api/api_id2",
          initialState: state,
          featureFlags: FeatureFlags,
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
      getByTestId("t--ide-tabs-add-button");
    });

    it("Renders Api add routes in Full Screen", () => {
      const page = PageFactory.build();
      const anApi = APIFactory.build({ id: "api_id", pageId: page.pageId });
      const state = getIDETestState({
        actions: [anApi],
        pages: [page],
        tabs: {
          [EditorEntityTab.QUERIES]: ["api_id"],
          [EditorEntityTab.JS]: [],
        },
      });

      const { getByTestId, getByText } = render(
        <Route path={BUILDER_PATH}>
          <IDE />
        </Route>,
        {
          url: "/app/applicationSlug/pageSlug-page_id/edit/api/api_id/add",
          initialState: state,
          featureFlags: FeatureFlags,
        },
      );

      // Create options are rendered
      getByText(createMessage(EDITOR_PANE_TEXTS.queries_create_from_existing));
      getByText("New datasource");
      getByText("REST API");
      // Check new tab presence
      const newTab = getByTestId("t--ide-tab-new");
      expect(newTab).not.toBeNull();
      // Close button is rendered
      expect(
        newTab.querySelector("[data-testid='t--tab-close-btn']"),
      ).not.toBeNull();
    });
    it("Renders Api add routes in Split Screen", () => {
      const page = PageFactory.build();
      const anApi = APIFactory.build({ id: "api_id", pageId: page.pageId });
      const state = getIDETestState({
        actions: [anApi],
        pages: [page],
        tabs: {
          [EditorEntityTab.QUERIES]: ["api_id"],
          [EditorEntityTab.JS]: [],
        },
        ideView: EditorViewMode.SplitScreen,
      });

      const { getAllByText, getByTestId, getByText, queryByTestId } = render(
        <Route path={BUILDER_PATH}>
          <IDE />
        </Route>,
        {
          url: "/app/applicationSlug/pageSlug-page_id/edit/api/api_id/add",
          initialState: state,
          featureFlags: FeatureFlags,
        },
      );

      // There will be 1 Api4 text ( The tab )
      expect(getAllByText("Api4").length).toEqual(1);
      // Tabs active state
      expect(getByTestId("t--ide-tab-Api4").classList.contains("active")).toBe(
        false,
      );
      // Add button should not present
      expect(queryByTestId("t--ide-tabs-add-button")).toBeNull();

      // Check if the form is not rendered
      expect(queryByTestId("t--action-form-API")).toBeNull();
      // Create options are rendered
      getByText(createMessage(EDITOR_PANE_TEXTS.queries_create_from_existing));
      getByText("New datasource");
      getByText("REST API");
      // Check new tab presence
      const newTab = getByTestId("t--ide-tab-new");
      expect(newTab).not.toBeNull();
      // Close button is rendered
      expect(
        newTab.querySelector("[data-testid='t--tab-close-btn']"),
      ).not.toBeNull();
    });
  });

  describe("Postgres Routes", () => {
    it("Renders Postgres routes in Full Screen", async () => {
      const page = PageFactory.build();
      const anQuery = PostgresFactory.build({
        id: "query_id",
        pageId: page.pageId,
      });
      const state = getIDETestState({
        actions: [anQuery],
        pages: [page],
        tabs: {
          [EditorEntityTab.QUERIES]: ["query_id"],
          [EditorEntityTab.JS]: [],
        },
      });

      const { getAllByText, getByRole, getByTestId } = render(
        <Route path={BUILDER_PATH}>
          <IDE />
        </Route>,
        {
          url: "/app/applicationSlug/pageSlug-page_id/edit/queries/query_id",
          sagasToRun: sagasToRunForTests,
          initialState: state,
          featureFlags: FeatureFlags,
        },
      );

      // There will be 3 Query1 text (Left pane list, editor tab and Editor form)
      expect(getAllByText("Query1").length).toBe(3);
      // Left pane active state
      expect(
        getByTestId("t--entity-item-Query1").classList.contains("active"),
      ).toBe(true);
      // Tabs active state
      expect(
        getByTestId("t--ide-tab-Query1").classList.contains("active"),
      ).toBe(true);

      await userEvent.click(getByRole("tab", { name: "Query" }));

      // Check if the form is rendered
      getByTestId("t--action-form-DB");
      // Check if run button is visible
      getByRole("button", { name: /run/i });
      // Check if the Add new button is shown
      getByRole("button", { name: "New query / API" });
    });
    it("Renders Postgres routes in Split screen", async () => {
      const page = PageFactory.build();
      const anQuery = PostgresFactory.build({
        id: "query_id",
        pageId: page.pageId,
      });
      const state = getIDETestState({
        actions: [anQuery],
        pages: [page],
        tabs: {
          [EditorEntityTab.QUERIES]: ["query_id"],
          [EditorEntityTab.JS]: [],
        },
        ideView: EditorViewMode.SplitScreen,
      });

      const { getAllByText, getByRole, getByTestId } = render(
        <Route path={BUILDER_PATH}>
          <IDE />
        </Route>,
        {
          url: "/app/applicationSlug/pageSlug-page_id/edit/queries/query_id",
          sagasToRun: sagasToRunForTests,
          initialState: state,
          featureFlags: FeatureFlags,
        },
      );

      // Check if editor is in split screen
      getByTestId("t--ide-maximize");
      getByTestId("t--widgets-editor");

      // Check if api is rendered in side by side
      expect(getAllByText("Query2").length).toBe(2);
      // Tabs active state
      expect(
        getByTestId("t--ide-tab-Query2").classList.contains("active"),
      ).toBe(true);

      await userEvent.click(getByRole("tab", { name: "Query" }));

      // Check if the form is rendered
      getByTestId("t--action-form-DB");
      // Check if run button is visible
      getByRole("button", { name: /run/i });
      // Check if the Add new button is shown
      getByTestId("t--ide-tabs-add-button");
    });
    it("Renders Postgres add routes in Full Screen", async () => {
      const page = PageFactory.build();
      const anQuery = PostgresFactory.build({
        id: "query_id",
        pageId: page.pageId,
      });
      const state = getIDETestState({
        actions: [anQuery],
        pages: [page],
        tabs: {
          [EditorEntityTab.QUERIES]: ["query_id"],
          [EditorEntityTab.JS]: [],
        },
      });

      const { container, getByTestId, getByText } = render(
        <Route path={BUILDER_PATH}>
          <IDE />
        </Route>,
        {
          url: `/app/applicationSlug/${page.slug}-${page.pageId}/edit/queries/query_id/add`,
          initialState: state,
          featureFlags: FeatureFlags,
          sagasToRun: sagasToRunForTests,
        },
      );

      screen.logTestingPlaygroundURL(container);

      // Create options are rendered
      getByText(createMessage(EDITOR_PANE_TEXTS.queries_create_from_existing));
      getByText("New datasource");
      getByText("REST API");
      // Check new tab presence
      const newTab = getByTestId("t--ide-tab-new");
      expect(newTab).not.toBeNull();
      // Close button is rendered
      expect(
        newTab.querySelector("[data-testid='t--tab-close-btn']"),
      ).not.toBeNull();
    });
    it("Renders Postgres add routes in Split Screen", () => {
      const page = PageFactory.build();
      const anQuery = PostgresFactory.build({
        id: "query_id",
        pageId: page.pageId,
      });
      const state = getIDETestState({
        actions: [anQuery],
        pages: [page],
        tabs: {
          [EditorEntityTab.QUERIES]: ["query_id"],
          [EditorEntityTab.JS]: [],
        },
        ideView: EditorViewMode.SplitScreen,
      });

      const { getAllByText, getByTestId, getByText, queryByTestId } = render(
        <Route path={BUILDER_PATH}>
          <IDE />
        </Route>,
        {
          url: "/app/applicationSlug/pageSlug-page_id/edit/queries/query_id/add",
          sagasToRun: sagasToRunForTests,
          initialState: state,
          featureFlags: FeatureFlags,
        },
      );

      // There will be 1 Api4 text ( The tab )
      expect(getAllByText("Query4").length).toEqual(1);
      // Tabs active state
      expect(
        getByTestId("t--ide-tab-Query4").classList.contains("active"),
      ).toBe(false);
      // Add button should not present
      expect(queryByTestId("t--ide-tabs-add-button")).toBeNull();

      // Check if the form is not rendered
      expect(queryByTestId("t--action-form-DB")).toBeNull();
      // Create options are rendered
      getByText(createMessage(EDITOR_PANE_TEXTS.queries_create_from_existing));
      getByText("New datasource");
      getByText("REST API");
      // Check new tab presence
      const newTab = getByTestId("t--ide-tab-new");
      expect(newTab).not.toBeNull();
      // Close button is rendered
      expect(
        newTab.querySelector("[data-testid='t--tab-close-btn']"),
      ).not.toBeNull();
    });
  });

  describe("Google Sheets Routes", () => {
    it("Renders Google Sheets routes in Full Screen", async () => {
      const page = PageFactory.build();
      const anQuery = GoogleSheetFactory.build({
        name: "Sheets1",
        id: "saas_api_id",
        pageId: page.pageId,
      });
      const state = getIDETestState({
        actions: [anQuery],
        pages: [page],
        tabs: {
          [EditorEntityTab.QUERIES]: ["saas_api_id"],
          [EditorEntityTab.JS]: [],
        },
      });

      const { getAllByText, getByRole, getByTestId } = render(
        <Route path={BUILDER_PATH}>
          <IDE />
        </Route>,
        {
          url: "/app/applicationSlug/pageSlug-page_id/edit/saas/google-sheets-plugin/api/saas_api_id",
          sagasToRun: sagasToRunForTests,
          initialState: state,
          featureFlags: FeatureFlags,
        },
      );

      // There will be 3 Query1 text (Left pane list, editor tab and Editor form)
      expect(getAllByText("Sheets1").length).toBe(3);
      // Left pane active state
      expect(
        getByTestId("t--entity-item-Sheets1").classList.contains("active"),
      ).toBe(true);
      // Tabs active state
      expect(
        getByTestId("t--ide-tab-Sheets1").classList.contains("active"),
      ).toBe(true);

      await userEvent.click(getByRole("tab", { name: "Query" }));

      // Check if the form is rendered
      getByTestId("t--action-form-SAAS");
      // Check if run button is visible
      getByRole("button", { name: /run/i });
      // Check if the Add new button is shown
      getByRole("button", { name: "New query / API" });
    });
    it("Renders Google Sheets routes in Split screen", async () => {
      const page = PageFactory.build();
      const anQuery = GoogleSheetFactory.build({
        name: "Sheets2",
        id: "saas_api_id",
        pageId: page.pageId,
      });
      const state = getIDETestState({
        actions: [anQuery],
        pages: [page],
        tabs: {
          [EditorEntityTab.QUERIES]: ["saas_api_id"],
          [EditorEntityTab.JS]: [],
        },
        ideView: EditorViewMode.SplitScreen,
      });

      const { container, getAllByText, getByRole, getByTestId } = render(
        <Route path={BUILDER_PATH}>
          <IDE />
        </Route>,
        {
          url: "/app/applicationSlug/pageSlug-page_id/edit/saas/google-sheets-plugin/api/saas_api_id",
          sagasToRun: sagasToRunForTests,
          initialState: state,
          featureFlags: FeatureFlags,
        },
      );

      // Check if editor is in split screen
      getByTestId("t--ide-maximize");
      getByTestId("t--widgets-editor");

      // Check if api is rendered in side by side
      expect(getAllByText("Sheets2").length).toBe(2);
      // Tabs active state
      expect(
        getByTestId("t--ide-tab-Sheets2").classList.contains("active"),
      ).toBe(true);

      await userEvent.click(getByRole("tab", { name: "Query" }));

      screen.logTestingPlaygroundURL(container);

      // Check if the form is rendered
      getByTestId("t--action-form-SAAS");
      // Check if run button is visible
      getByRole("button", { name: /run/i });
      // Check if the Add new button is shown
      getByTestId("t--ide-tabs-add-button");
    });
    it("Renders Google Sheets add routes in Full Screen", async () => {
      const page = PageFactory.build();
      const anQuery = GoogleSheetFactory.build({
        name: "Sheets3",
        id: "saas_api_id",
        pageId: page.pageId,
      });
      const state = getIDETestState({
        actions: [anQuery],
        pages: [page],
        tabs: {
          [EditorEntityTab.QUERIES]: ["saas_api_id"],
          [EditorEntityTab.JS]: [],
        },
      });

      const { container, getByTestId, getByText } = render(
        <Route path={BUILDER_PATH}>
          <IDE />
        </Route>,
        {
          url: "/app/applicationSlug/pageSlug-page_id/edit/saas/google-sheets-plugin/api/saas_api_id/add",
          initialState: state,
          featureFlags: FeatureFlags,
          sagasToRun: sagasToRunForTests,
        },
      );

      screen.logTestingPlaygroundURL(container);

      // Create options are rendered
      getByText(createMessage(EDITOR_PANE_TEXTS.queries_create_from_existing));
      getByText("New datasource");
      getByText("REST API");
      // Check new tab presence
      const newTab = getByTestId("t--ide-tab-new");
      expect(newTab).not.toBeNull();
      // Close button is rendered
      expect(
        newTab.querySelector("[data-testid='t--tab-close-btn']"),
      ).not.toBeNull();
    });
    it("Renders Google Sheets add routes in Split Screen", async () => {
      const page = PageFactory.build();
      const anQuery = PostgresFactory.build({
        name: "Sheets4",
        id: "saas_api_id",
        pageId: page.pageId,
      });
      const state = getIDETestState({
        actions: [anQuery],
        pages: [page],
        tabs: {
          [EditorEntityTab.QUERIES]: ["saas_api_id"],
          [EditorEntityTab.JS]: [],
        },
        ideView: EditorViewMode.SplitScreen,
      });

      const { getAllByText, getByTestId, getByText, queryByTestId } = render(
        <Route path={BUILDER_PATH}>
          <IDE />
        </Route>,
        {
          url: "/app/applicationSlug/pageSlug-page_id/edit/saas/google-sheets-plugin/api/saas_api_id/add",
          sagasToRun: sagasToRunForTests,
          initialState: state,
          featureFlags: FeatureFlags,
        },
      );

      // There will be 1 Api4 text ( The tab )
      expect(getAllByText("Sheets4").length).toEqual(1);
      // Tabs active state
      expect(
        getByTestId("t--ide-tab-Sheets4").classList.contains("active"),
      ).toBe(false);
      // Add button active state
      expect(queryByTestId("t--ide-tabs-add-button")).toBeNull();

      // Check if the form is not rendered
      expect(queryByTestId("t--action-form-SAAS")).toBeNull();
      // Create options are rendered
      getByText(createMessage(EDITOR_PANE_TEXTS.queries_create_from_existing));
      getByText("New datasource");
      getByText("REST API");
      // Check new tab presence
      const newTab = getByTestId("t--ide-tab-new");
      expect(newTab).not.toBeNull();
      // Close button is rendered
      expect(
        newTab.querySelector("[data-testid='t--tab-close-btn']"),
      ).not.toBeNull();
    });
  });
});
