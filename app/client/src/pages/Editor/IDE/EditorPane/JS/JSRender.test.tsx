import { render, waitFor } from "test/testUtils";
import { Route } from "react-router-dom";
import { BUILDER_PATH } from "ee/constants/routes/appRoutes";
import IDE from "pages/Editor/IDE/index";
import React from "react";
import { createMessage, EDITOR_PANE_TEXTS } from "ee/constants/messages";
import { getIDETestState } from "test/factories/AppIDEFactoryUtils";
import { EditorEntityTab, EditorViewMode } from "IDE/Interfaces/EditorTypes";
import { PageFactory } from "test/factories/PageFactory";
import { JSObjectFactory } from "test/factories/Actions/JSObject";

const basePageId = "0123456789abcdef00000000";

describe("IDE Render: JS", () => {
  describe("JS Blank State", () => {
    it("Renders Fullscreen Blank State", async () => {
      const { findByText, getByRole, getByText } = render(
        <Route path={BUILDER_PATH}>
          <IDE />
        </Route>,
        {
          url: `/app/applicationSlug/pageSlug-${basePageId}/edit/jsObjects`,
        },
      );

      // Main pane text
      await findByText(createMessage(EDITOR_PANE_TEXTS.js_blank_state));

      // Left pane text
      getByText(createMessage(EDITOR_PANE_TEXTS.js_blank_state_description));

      // CTA button is rendered
      getByRole("button", {
        name: createMessage(EDITOR_PANE_TEXTS.js_add_button),
      });
    });

    it("Renders Split Screen Blank State", () => {
      const state = getIDETestState({ ideView: EditorViewMode.SplitScreen });
      const { getByRole, getByTestId, getByText } = render(
        <Route path={BUILDER_PATH}>
          <IDE />
        </Route>,
        {
          url: `/app/applicationSlug/pageSlug-${basePageId}/edit/jsObjects`,
          initialState: state,
        },
      );

      // Check if editor is in split screen
      getByTestId("t--ide-maximize");
      getByTestId("t--widgets-editor");

      // Left pane text
      getByText(createMessage(EDITOR_PANE_TEXTS.js_blank_state_description));

      // CTA button is rendered
      getByRole("button", {
        name: createMessage(EDITOR_PANE_TEXTS.js_add_button),
      });
    });

    it("Renders Fullscreen Add in Blank State", async () => {
      const { findByText, getByTestId, getByText } = render(
        <Route path={BUILDER_PATH}>
          <IDE />
        </Route>,
        {
          url: `/app/applicationSlug/pageSlug-${basePageId}/edit/jsObjects/add`,
        },
      );

      // Main pane text
      await findByText(createMessage(EDITOR_PANE_TEXTS.js_create_tab_title));

      // Left pane description
      getByText(createMessage(EDITOR_PANE_TEXTS.js_blank_state_description));

      // Create options are rendered
      getByText(createMessage(EDITOR_PANE_TEXTS.js_blank_object_item));
      // Tab close button is rendered
      getByTestId("t--tab-close-btn");
    });

    it("Renders Split Screen Add in Blank State", () => {
      const state = getIDETestState({ ideView: EditorViewMode.SplitScreen });
      const { getByTestId, getByText } = render(
        <Route path={BUILDER_PATH}>
          <IDE />
        </Route>,
        {
          url: `/app/applicationSlug/pageSlug-${basePageId}/edit/jsObjects/add`,
          initialState: state,
        },
      );

      // Check if editor is in split screen
      getByTestId("t--ide-maximize");
      getByTestId("t--widgets-editor");

      // Left pane header
      getByText(createMessage(EDITOR_PANE_TEXTS.js_create_tab_title));

      // Create options are rendered
      getByText(createMessage(EDITOR_PANE_TEXTS.js_blank_object_item));
    });
  });

  describe("JS Edit Render", () => {
    it("Renders JS routes in Full screen", async () => {
      const page = PageFactory.build();
      const js1 = JSObjectFactory.build({
        pageId: page.pageId,
      });

      const state = getIDETestState({
        pages: [page],
        js: [js1],
        tabs: {
          [EditorEntityTab.QUERIES]: [],
          [EditorEntityTab.JS]: [js1.baseId],
        },
      });

      const { getAllByText, getByRole, getByTestId } = render(
        <Route path={BUILDER_PATH}>
          <IDE />
        </Route>,
        {
          url: `/app/applicationSlug/pageSlug-${page.basePageId}/edit/jsObjects/${js1.baseId}`,
          initialState: state,
        },
      );

      await waitFor(
        async () => {
          const elements = getAllByText("JSObject1"); // Use the common test ID or selector

          expect(elements).toHaveLength(2); // Wait until there are exactly 2 elements
        },
        { timeout: 3000, interval: 500 },
      );

      // There will be 2 JSObject1 text (Left pane list and editor tab)
      expect(getAllByText("JSObject1").length).toEqual(2);
      // Left pane active state
      expect(
        getByTestId("t--entity-item-JSObject1").getAttribute("data-selected"),
      ).toBe("true");
      // Tabs active state
      expect(
        getByTestId("t--ide-tab-jsobject1").classList.contains("active"),
      ).toBe(true);
      // Check toolbar elements
      getByRole("button", { name: /myFun1/i });
      getByRole("button", { name: /run/i });
      getByTestId("t--js-settings-trigger");
      getByTestId("t--more-action-trigger");

      // Check if the Add new button is shown
      getByTestId("t--add-item");

      // check bottom tabs
      getByRole("tab", { name: /response/i });
      getByRole("tab", { name: /logs/i });
      getByRole("tab", { name: /linter/i });
    });

    it("Renders JS routes in Split Screen", async () => {
      const page = PageFactory.build();
      const js2 = JSObjectFactory.build({
        id: "js_id2",
        baseId: "js_base_id2",
        pageId: page.pageId,
      });
      const state = getIDETestState({
        js: [js2],
        pages: [page],
        tabs: {
          [EditorEntityTab.QUERIES]: [],
          [EditorEntityTab.JS]: [js2.baseId],
        },
        ideView: EditorViewMode.SplitScreen,
      });

      const { getAllByText, getByRole, getByTestId } = render(
        <Route path={BUILDER_PATH}>
          <IDE />
        </Route>,
        {
          url: `/app/applicationSlug/pageSlug-${page.basePageId}/edit/jsObjects/${js2.baseId}`,
          initialState: state,
        },
      );

      // Check if editor is in split screen
      getByTestId("t--ide-maximize");
      getByTestId("t--widgets-editor");

      // Check if js is rendered in side by side
      expect(getAllByText("JSObject2").length).toBe(1);
      // Tabs active state
      expect(
        getByTestId("t--ide-tab-jsobject2").classList.contains("active"),
      ).toBe(true);

      // Check toolbar elements
      getByRole("button", { name: /myFun1/i });
      getByRole("button", { name: /run/i });
      getByTestId("t--more-action-trigger");

      // Check if the Add new button is shown
      getByTestId("t--ide-tabs-add-button");

      // check bottom tabs
      getByRole("tab", { name: /response/i });
      getByRole("tab", { name: /logs/i });
    });

    it("Renders JS add routes in Full Screen", () => {
      const page = PageFactory.build();
      const js3 = JSObjectFactory.build({
        id: "js_id3",
        baseId: "js_base_id3",
        pageId: page.pageId,
      });
      const state = getIDETestState({
        js: [js3],
        pages: [page],
        tabs: {
          [EditorEntityTab.QUERIES]: [],
          [EditorEntityTab.JS]: [js3.baseId],
        },
      });

      const { container, getAllByText, getByTestId, getByText } = render(
        <Route path={BUILDER_PATH}>
          <IDE />
        </Route>,
        {
          url: `/app/applicationSlug/pageSlug-${page.basePageId}/edit/jsObjects/${js3.baseId}/add`,
          initialState: state,
        },
      );

      // There will be 2 JSObject3 text (editor tab and Editor form)
      expect(getAllByText("JSObject3").length).toEqual(2);
      // Tabs active state
      expect(
        getByTestId("t--ide-tab-jsobject3").classList.contains("active"),
      ).toBe(false);
      // Check js object is not rendered. Instead new tab should render
      expect(container.querySelector(".js-editor-tab")).toBeNull();
      // Check is new tab is visible
      getByText("New JS");
      // Create options are rendered
      getByText(createMessage(EDITOR_PANE_TEXTS.js_blank_object_item));
    });

    it("Renders JS add routes in Split Screen", () => {
      const page = PageFactory.build();
      const js4 = JSObjectFactory.build({
        id: "js_id4",
        baseId: "js_base_id4",
        pageId: page.pageId,
      });
      const state = getIDETestState({
        js: [js4],
        pages: [page],
        tabs: {
          [EditorEntityTab.QUERIES]: [],
          [EditorEntityTab.JS]: [js4.baseId],
        },
        ideView: EditorViewMode.SplitScreen,
      });

      const { container, getAllByText, getByTestId, getByText } = render(
        <Route path={BUILDER_PATH}>
          <IDE />
        </Route>,
        {
          url: `/app/applicationSlug/pageSlug-${page.basePageId}/edit/jsObjects/${js4.baseId}/add`,
          initialState: state,
        },
      );

      // There will be 1 JSObject3 text ( The tab )
      expect(getAllByText("JSObject4").length).toEqual(1);
      // Tabs active state
      expect(
        getByTestId("t--ide-tab-jsobject4").classList.contains("active"),
      ).toBe(false);

      // Check if the form is not rendered
      expect(container.querySelector(".js-editor-tab")).toBeNull();
      // Create options are rendered
      getByText(createMessage(EDITOR_PANE_TEXTS.js_blank_object_item));
    });

    it("Prevents edit of main JS object", () => {
      const page = PageFactory.build();
      const Main_JS = JSObjectFactory.build({
        id: "js_id",
        baseId: "js_base_id",
        name: "Main",
        pageId: page.pageId,
      });

      Main_JS.isMainJSCollection = true;

      const Normal_JS = JSObjectFactory.build({
        id: "js_id2",
        baseId: "js_base_id2",
        name: "Normal",
        pageId: page.pageId,
      });

      const state = getIDETestState({
        pages: [page],
        js: [Main_JS, Normal_JS],
        tabs: {
          [EditorEntityTab.QUERIES]: [],
          [EditorEntityTab.JS]: [Main_JS.baseId],
        },
      });

      const { getByTestId } = render(
        <Route path={BUILDER_PATH}>
          <IDE />
        </Route>,
        {
          url: `/app/applicationSlug/pageSlug-${page.basePageId}/edit/jsObjects/${Main_JS.baseId}`,
          initialState: state,
        },
      );

      // Normal JS object should be editable
      const normalJsObjectEntity = getByTestId("t--entity-item-Normal");

      expect(normalJsObjectEntity.classList.contains("editable")).toBe(true);

      // should have `t--context-menu` as a child of the normalJsObjectEntity
      expect(
        normalJsObjectEntity.querySelector(".t--context-menu"),
      ).not.toBeNull();

      // Main JS object should not be editable
      const mainJsObjectEntity = getByTestId("t--entity-item-Main");

      expect(mainJsObjectEntity.classList.contains("editable")).toBe(false);
      // should not have `t--context-menu` as a child of the mainJsObjectEntity
      expect(mainJsObjectEntity.querySelector(".t--context-menu")).toBeNull();
    });
  });
});
