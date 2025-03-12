import React from "react";
import { Route } from "react-router-dom";
import { render } from "test/testUtils";
import IDE from "../../../index";
import { createMessage, EDITOR_PANE_TEXTS } from "ee/constants/messages";
import { BUILDER_PATH } from "ee/constants/routes/appRoutes";
import { EditorViewMode } from "IDE/Interfaces/EditorTypes";
import { getIDETestState } from "test/factories/AppIDEFactoryUtils";

const basePageId = "0123456789abcdef00000000";

describe("IDE URL rendering of Queries", () => {
  describe("Query Blank State", () => {
    it("Renders Fullscreen Blank State", async () => {
      const { findByText, getByRole, getByText } = render(
        <Route path={BUILDER_PATH}>
          <IDE />
        </Route>,
        {
          url: `/app/applicationSlug/pageSlug-${basePageId}/edit/queries`,
        },
      );

      // Main pane text
      await findByText(createMessage(EDITOR_PANE_TEXTS.query_blank_state));

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
          url: `/app/applicationSlug/pageSlug-${basePageId}/edit/queries`,
          initialState: state,
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

    it("Renders Fullscreen Add in Blank State", async () => {
      const { findByText, getByTestId, getByText } = render(
        <Route path={BUILDER_PATH}>
          <IDE />
        </Route>,
        {
          url: `/app/applicationSlug/pageSlug-${basePageId}/edit/queries/add`,
        },
      );

      // Create options are rendered
      await findByText(
        createMessage(EDITOR_PANE_TEXTS.queries_create_from_existing),
      );
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

    it("Renders Split Screen Add in Blank State", () => {
      const state = getIDETestState({ ideView: EditorViewMode.SplitScreen });
      const { getByTestId, getByText } = render(
        <Route path={BUILDER_PATH}>
          <IDE />
        </Route>,
        {
          url: `/app/applicationSlug/pageSlug-${basePageId}/edit/queries/add`,
          initialState: state,
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
      const newTab = getByTestId("t--ide-tab-new_query");

      expect(newTab).not.toBeNull();
      // Close button is rendered
      expect(
        newTab.querySelector("[data-testid='t--tab-close-btn']"),
      ).not.toBeNull();
    });
  });
});
