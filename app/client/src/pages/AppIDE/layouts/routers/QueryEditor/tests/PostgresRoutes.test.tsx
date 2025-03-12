import React from "react";
import { Route } from "react-router-dom";
import { render } from "test/testUtils";
import IDE from "../../../index";
import { createMessage, EDITOR_PANE_TEXTS } from "ee/constants/messages";
import { BUILDER_PATH } from "ee/constants/routes/appRoutes";
import { EditorEntityTab, EditorViewMode } from "IDE/Interfaces/EditorTypes";
import { PostgresFactory } from "test/factories/Actions/Postgres";
import { sagasToRunForTests } from "test/sagas";
import { getIDETestState } from "test/factories/AppIDEFactoryUtils";
import { PageFactory } from "test/factories/PageFactory";
import { waitFor } from "@testing-library/react";

describe("IDE URL rendering of Queries", () => {
  describe("Postgres Routes", () => {
    it("Renders Postgres routes in Full Screen", async () => {
      const page = PageFactory.build();
      const anQuery = PostgresFactory.build({
        id: "query_id",
        baseId: "query_base_id",
        pageId: page.pageId,
      });
      const state = getIDETestState({
        actions: [anQuery],
        pages: [page],
        tabs: {
          [EditorEntityTab.QUERIES]: [anQuery.baseId],
          [EditorEntityTab.JS]: [],
        },
      });

      const { getAllByText, getByRole, getByTestId } = render(
        <Route path={BUILDER_PATH}>
          <IDE />
        </Route>,
        {
          url: `/app/applicationSlug/pageSlug-${page.basePageId}/edit/queries/${anQuery.baseId}`,
          sagasToRun: sagasToRunForTests,
          initialState: state,
        },
      );

      await waitFor(
        async () => {
          const elements = getAllByText("Query1"); // Use the common test ID or selector

          expect(elements).toHaveLength(2); // Wait until there are exactly 3 elements
        },
        { timeout: 3000, interval: 500 },
      );
      // There will be 2 Query1 text (Left pane list, editor tab)
      expect(getAllByText("Query1").length).toBe(2);
      // Left pane active state
      expect(
        getByTestId("t--entity-item-Query1").classList.contains("active"),
      ).toBe(true);
      // Tabs active state
      expect(
        getByTestId("t--ide-tab-query1").classList.contains("active"),
      ).toBe(true);
      // Check if the form is rendered
      getByTestId("t--uqi-editor-form");
      // Check if run button is visible
      getByRole("button", { name: /run/i });
      // Check if the Add new button is shown
      getByTestId("t--add-item");

      // Check if the bottom view is rendered

      getByRole("tab", { name: /datasource/i, selected: true });

      getByRole("tab", { name: /response/i });
      getByRole("tab", { name: /logs/i });
      getByRole("tab", { name: /linter/i });
    });

    it("Renders Postgres routes in Split screen", async () => {
      const page = PageFactory.build();
      const anQuery = PostgresFactory.build({
        id: "query_id",
        baseId: "query_base_id",
        pageId: page.pageId,
      });
      const state = getIDETestState({
        actions: [anQuery],
        pages: [page],
        tabs: {
          [EditorEntityTab.QUERIES]: [anQuery.baseId],
          [EditorEntityTab.JS]: [],
        },
        ideView: EditorViewMode.SplitScreen,
      });

      const { getAllByText, getByRole, getByTestId } = render(
        <Route path={BUILDER_PATH}>
          <IDE />
        </Route>,
        {
          url: `/app/applicationSlug/pageSlug-${page.basePageId}/edit/queries/${anQuery.baseId}`,
          sagasToRun: sagasToRunForTests,
          initialState: state,
        },
      );

      // Check if editor is in split screen
      getByTestId("t--ide-maximize");
      getByTestId("t--widgets-editor");

      // Check if api is rendered in side by side
      expect(getAllByText("Query2").length).toBe(1);
      // Tabs active state
      expect(
        getByTestId("t--ide-tab-query2").classList.contains("active"),
      ).toBe(true);

      // Check if the form is rendered
      getByTestId("t--uqi-editor-form");
      // Check if run button is visible
      getByRole("button", { name: /run/i });
      // Check if the Add new button is shown
      getByTestId("t--ide-tabs-add-button");

      // Check if the bottom view is rendered

      getByRole("tab", { name: /datasource/i, selected: true });

      getByRole("tab", { name: /response/i });
    });

    it("Renders Postgres add routes in Full Screen", async () => {
      const page = PageFactory.build();
      const anQuery = PostgresFactory.build({
        id: "query_id",
        baseId: "query_base_id",
        pageId: page.pageId,
      });
      const state = getIDETestState({
        actions: [anQuery],
        pages: [page],
        tabs: {
          [EditorEntityTab.QUERIES]: [anQuery.baseId],
          [EditorEntityTab.JS]: [],
        },
      });

      const { getByTestId, getByText } = render(
        <Route path={BUILDER_PATH}>
          <IDE />
        </Route>,
        {
          url: `/app/applicationSlug/${page.slug}-${page.pageId}/edit/queries/${anQuery.baseId}/add`,
          initialState: state,

          sagasToRun: sagasToRunForTests,
        },
      );

      // Create options are rendered
      getByText(createMessage(EDITOR_PANE_TEXTS.queries_create_from_existing));
      getByText("New datasource");
      getByText("REST API");
      // Check new tab presence
      const newTab = getByTestId("t--ide-tab-new_query");

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
        baseId: "query_base_id",
        pageId: page.pageId,
      });
      const state = getIDETestState({
        actions: [anQuery],
        pages: [page],
        tabs: {
          [EditorEntityTab.QUERIES]: [anQuery.baseId],
          [EditorEntityTab.JS]: [],
        },
        ideView: EditorViewMode.SplitScreen,
      });

      const { getAllByText, getByTestId, getByText, queryByTestId } = render(
        <Route path={BUILDER_PATH}>
          <IDE />
        </Route>,
        {
          url: `/app/applicationSlug/pageSlug-${page.basePageId}/edit/queries/${anQuery.baseId}/add`,
          sagasToRun: sagasToRunForTests,
          initialState: state,
        },
      );

      // There will be 1 Api4 text ( The tab )
      expect(getAllByText("Query4").length).toEqual(1);
      // Tabs active state
      expect(
        getByTestId("t--ide-tab-query4").classList.contains("active"),
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
      const newTab = getByTestId("t--ide-tab-new_query");

      expect(newTab).not.toBeNull();
      // Close button is rendered
      expect(
        newTab.querySelector("[data-testid='t--tab-close-btn']"),
      ).not.toBeNull();
    });
  });
});
