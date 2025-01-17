import React from "react";
import { fireEvent, render } from "test/testUtils";
import EditorTabs from ".";
import { getIDETestState } from "test/factories/AppIDEFactoryUtils";
import { EditorEntityTab, EditorViewMode } from "ee/entities/IDE/constants";
import { Route } from "react-router-dom";
import { BUILDER_PATH } from "ee/constants/routes/appRoutes";
import "@testing-library/jest-dom";
import { PageFactory } from "test/factories/PageFactory";
import { APIFactory } from "test/factories/Actions/API";
import type { AppState } from "ee/reducers";

const FeatureFlags = {
  rollout_side_by_side_enabled: true,
};

describe("EditorTabs render checks", () => {
  const page = PageFactory.build();

  const renderComponent = (url: string, state: Partial<AppState>) =>
    render(
      <Route path={BUILDER_PATH}>
        <EditorTabs />
      </Route>,
      {
        url,
        featureFlags: FeatureFlags,
        initialState: state,
      },
    );

  it("Do not render component when segment is UI", () => {
    const state = getIDETestState({ ideView: EditorViewMode.FullScreen });
    const { container } = renderComponent(
      `/app/applicationSlug/pageSlug-${page.basePageId}/edit`,
      state,
    );

    expect(container.firstChild).toBeNull();
  });

  it("Renders correctly in split view", () => {
    const state = getIDETestState({ ideView: EditorViewMode.SplitScreen });
    const { getByTestId, queryByTestId } = renderComponent(
      `/app/applicationSlug/pageSlug-${page.basePageId}/edit/queries`,
      state,
    );
    // check tabs is empty
    const tabsContainer = getByTestId("t--tabs-container");

    expect(tabsContainer.firstChild).toBeNull();

    //check add button is not present
    expect(queryByTestId("t--ide-tabs-add-button")).toBeNull();

    //check maximise button presence
    expect(getByTestId("t--ide-maximize")).not.toBeNull();

    //check list view present or not
    expect(getByTestId("t--editorpane-list-view")).not.toBeNull();
  });

  it("Renders correctly in fullscreen view", () => {
    const state = getIDETestState({ ideView: EditorViewMode.FullScreen });
    const { getByTestId, queryByTestId } = renderComponent(
      `/app/applicationSlug/pageSlug-${page.basePageId}/edit/queries`,
      state,
    );

    // check toggle
    expect(queryByTestId("t--list-toggle")).toBeNull();

    // check tabs is empty
    const tabsContainer = getByTestId("t--tabs-container");

    expect(tabsContainer.firstChild).toBeNull();

    //check add button is not present
    expect(queryByTestId("t--ide-tabs-add-button")).toBeNull();

    //check t--ide-minimize button presence
    expect(getByTestId("t--ide-minimize")).not.toBeNull();

    //check list view present or not
    expect(queryByTestId("t--editorpane-list-view")).toBeNull();
  });

  it("Renders correctly with tabs in split view", () => {
    const anApi = APIFactory.build({
      id: "api_id",
      baseId: "api_base_id",
      pageId: page.pageId,
    });
    const state = getIDETestState({
      pages: [page],
      actions: [anApi],
      ideView: EditorViewMode.SplitScreen,
      tabs: {
        [EditorEntityTab.QUERIES]: [anApi.baseId],
        [EditorEntityTab.JS]: [],
      },
    });
    const { getByTestId, queryByTestId } = renderComponent(
      `/app/applicationSlug/pageSlug-${page.basePageId}/edit/queries`,
      state,
    );

    // check toggle is not active
    expect(getByTestId("t--list-toggle")).toHaveAttribute(
      "data-selected",
      "false",
    );

    // check tabs is not empty
    const tabsContainer = getByTestId("t--tabs-container");

    expect(tabsContainer.firstChild).not.toBeNull();

    //check add button is present
    expect(getByTestId("t--ide-tabs-add-button")).not.toBeNull();

    //check maximise button presence
    expect(getByTestId("t--ide-maximize")).not.toBeNull();

    //check list view present or not
    expect(queryByTestId("t--editorpane-list-view")).toBeNull();
  });

  it("Renders correctly with tabs in fullscreen view", () => {
    const anApi = APIFactory.build({
      id: "api_id",
      baseId: "api_base_id",
      pageId: page.pageId,
    });
    const state = getIDETestState({
      pages: [page],
      actions: [anApi],
      ideView: EditorViewMode.FullScreen,
      tabs: {
        [EditorEntityTab.QUERIES]: [anApi.baseId],
        [EditorEntityTab.JS]: [],
      },
    });
    const { getByTestId, queryByTestId } = renderComponent(
      `/app/applicationSlug/pageSlug-${page.basePageId}/edit/queries`,
      state,
    );

    // check toggle
    expect(queryByTestId("t--list-toggle")).toBeNull();

    // check tabs is not empty
    const tabsContainer = getByTestId("t--tabs-container");

    expect(tabsContainer.firstChild).not.toBeNull();

    //check add button is present
    expect(getByTestId("t--ide-tabs-add-button")).not.toBeNull();

    //check minimize button presence
    expect(getByTestId("t--ide-minimize")).not.toBeNull();

    //check list view to be null
    expect(queryByTestId("t--editorpane-list-view")).toBeNull();
  });

  it("Render list view onclick of toggle in split view", () => {
    const anApi = APIFactory.build({
      id: "api_id",
      baseId: "api_base_id",
      pageId: page.pageId,
    });
    const state = getIDETestState({
      pages: [page],
      actions: [anApi],
      ideView: EditorViewMode.SplitScreen,
      tabs: {
        [EditorEntityTab.QUERIES]: [anApi.baseId],
        [EditorEntityTab.JS]: [],
      },
    });
    const { getByTestId } = renderComponent(
      `/app/applicationSlug/pageSlug-${page.basePageId}/edit/queries/${anApi.baseId}`,
      state,
    );

    fireEvent.click(getByTestId("t--list-toggle"));

    // check list view
    expect(getByTestId("t--editorpane-list-view")).not.toBeNull();
  });

  it("Render Add tab in split view", () => {
    const anApi = APIFactory.build({
      id: "api_id",
      baseId: "api_base_id",
      pageId: page.pageId,
    });
    const state = getIDETestState({
      pages: [page],
      actions: [anApi],
      ideView: EditorViewMode.SplitScreen,
      tabs: {
        [EditorEntityTab.QUERIES]: [anApi.baseId],
        [EditorEntityTab.JS]: [],
      },
    });
    const { getByTestId } = renderComponent(
      `/app/applicationSlug/pageSlug-${page.basePageId}/edit/queries/${anApi.baseId}/add`,
      state,
    );

    // check list view
    expect(getByTestId("t--ide-tab-new_query")).not.toBeNull();
  });

  it("Render Add tab in fullscreen view", () => {
    const anApi = APIFactory.build({
      id: "api_id",
      baseId: "api_base_id",
      pageId: page.pageId,
    });
    const state = getIDETestState({
      pages: [page],
      actions: [anApi],
      ideView: EditorViewMode.FullScreen,
      tabs: {
        [EditorEntityTab.QUERIES]: [anApi.baseId],
        [EditorEntityTab.JS]: [],
      },
    });
    const { getByTestId } = renderComponent(
      `/app/applicationSlug/pageSlug-${page.basePageId}/edit/queries/${anApi.baseId}/add`,
      state,
    );

    // check list view
    expect(getByTestId("t--ide-tab-new_query")).not.toBeNull();
  });

  it("Render list view on top of add tab", () => {
    const anApi = APIFactory.build({
      id: "api_id",
      baseId: "api_base_id",
      pageId: page.pageId,
    });
    const state = getIDETestState({
      pages: [page],
      actions: [anApi],
      ideView: EditorViewMode.SplitScreen,
      tabs: {
        [EditorEntityTab.QUERIES]: [anApi.baseId],
        [EditorEntityTab.JS]: [],
      },
    });
    const { getByTestId } = renderComponent(
      `/app/applicationSlug/pageSlug-${page.basePageId}/edit/queries/${anApi.baseId}/add`,
      state,
    );

    // open add view
    fireEvent.click(getByTestId("t--list-toggle"));

    // check list view
    expect(getByTestId("t--editorpane-list-view")).not.toBeNull();
  });

  it("Check CURL is rendering properly(not to render list view)", () => {
    const anApi = APIFactory.build({
      id: "api_id",
      baseId: "api_base_id",
      pageId: page.pageId,
    });
    const state = getIDETestState({
      pages: [page],
      actions: [anApi],
      ideView: EditorViewMode.SplitScreen,
      tabs: {
        [EditorEntityTab.QUERIES]: [anApi.baseId],
        [EditorEntityTab.JS]: [],
      },
    });
    const { queryByTestId } = renderComponent(
      `/app/applicationSlug/pageSlug-${page.basePageId}/edit/saas/google-sheets-plugin/api/${anApi.baseId}`,
      state,
    );

    expect(queryByTestId("t--editorpane-list-view")).toBeNull();
  });
});
