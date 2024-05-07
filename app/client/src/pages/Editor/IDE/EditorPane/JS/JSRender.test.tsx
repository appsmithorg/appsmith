import localStorage from "utils/localStorage";
import { render } from "test/testUtils";
import { Route } from "react-router-dom";
import { BUILDER_PATH } from "@appsmith/constants/routes/appRoutes";
import IDE from "pages/Editor/IDE/index";
import React from "react";
import { createMessage, EDITOR_PANE_TEXTS } from "@appsmith/constants/messages";
import { getIDETestState } from "test/factories/AppIDEFactoryUtils";
import {
  EditorEntityTab,
  EditorViewMode,
} from "@appsmith/entities/IDE/constants";
import { PageFactory } from "test/factories/PageFactory";
import { JSObjectFactory } from "test/factories/Actions/JSObject";

const FeatureFlags = {
  rollout_side_by_side_enabled: true,
};
describe("IDE Render: JS", () => {
  localStorage.setItem("SPLITPANE_ANNOUNCEMENT", "false");
  describe("JS Blank State", () => {
    it("Renders Fullscreen Blank State", () => {
      const { getByRole, getByText } = render(
        <Route path={BUILDER_PATH}>
          <IDE />
        </Route>,
        {
          url: "/app/applicationSlug/pageSlug-page_id/edit/jsObjects",
          featureFlags: FeatureFlags,
        },
      );

      // Main pane text
      getByText(createMessage(EDITOR_PANE_TEXTS.js_blank_state));

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
          url: "/app/applicationSlug/pageSlug-page_id/edit/jsObjects",
          initialState: state,
          featureFlags: FeatureFlags,
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

    it("Renders Fullscreen Add in Blank State", () => {
      const { getByRole, getByText } = render(
        <Route path={BUILDER_PATH}>
          <IDE />
        </Route>,
        {
          url: "/app/applicationSlug/pageSlug-page_id/edit/jsObjects/add",
          featureFlags: FeatureFlags,
        },
      );

      // Main pane text
      getByText(createMessage(EDITOR_PANE_TEXTS.js_blank_state));

      // Left pane header
      getByText(createMessage(EDITOR_PANE_TEXTS.js_create_tab_title));

      // Create options are rendered
      getByText(createMessage(EDITOR_PANE_TEXTS.js_blank_object_item));
      // Close button is rendered
      getByRole("button", { name: "Close pane" });
    });

    it("Renders Split Screen Add in Blank State", () => {
      const state = getIDETestState({ ideView: EditorViewMode.SplitScreen });
      const { getByRole, getByTestId, getByText } = render(
        <Route path={BUILDER_PATH}>
          <IDE />
        </Route>,
        {
          url: "/app/applicationSlug/pageSlug-page_id/edit/jsObjects/add",
          initialState: state,
          featureFlags: FeatureFlags,
        },
      );

      // Check if editor is in split screen
      getByTestId("t--ide-maximize");
      getByTestId("t--widgets-editor");

      // Left pane header
      getByText(createMessage(EDITOR_PANE_TEXTS.js_create_tab_title));

      // Create options are rendered
      getByText(createMessage(EDITOR_PANE_TEXTS.js_blank_object_item));
      // Close button is rendered
      getByRole("button", { name: "Close pane" });
    });
  });

  describe("JS Edit Render", () => {
    it("Renders JS routes in Full screen", () => {
      const page = PageFactory.build();
      const JS = JSObjectFactory.build({ id: "js_id", pageId: page.pageId });

      const state = getIDETestState({
        pages: [page],
        js: [JS],
        tabs: {
          [EditorEntityTab.QUERIES]: [],
          [EditorEntityTab.JS]: ["js_id"],
        },
      });

      const { container, getAllByText, getByRole, getByTestId } = render(
        <Route path={BUILDER_PATH}>
          <IDE />
        </Route>,
        {
          url: "/app/applicationSlug/pageSlug-page_id/edit/jsObjects/js_id",
          initialState: state,
          featureFlags: FeatureFlags,
        },
      );

      // There will be 3 JSObject1 text (Left pane list, editor tab and Editor form)
      expect(getAllByText("JSObject1").length).toEqual(3);
      // Left pane active state
      expect(
        getByTestId("t--entity-item-JSObject1").classList.contains("active"),
      ).toBe(true);
      // Tabs active state
      expect(
        getByTestId("t--ide-tab-JSObject1").classList.contains("active"),
      ).toBe(true);
      // Check if the form is rendered
      expect(container.querySelector(".js-editor-tab")).not.toBeNull();
      // Check if the code and settings tabs is visible
      getByRole("tab", { name: /code/i });
      getByRole("tab", { name: /settings/i });
      // Check if run button is visible
      getByRole("button", { name: /run/i });
      // Check if the Add new button is shown
      getByRole("button", {
        name: createMessage(EDITOR_PANE_TEXTS.js_add_button),
      });
    });

    it("Renders JS routes in Split Screen", async () => {
      const page = PageFactory.build();
      const js2 = JSObjectFactory.build({
        id: "js_id2",
        pageId: page.pageId,
      });
      const state = getIDETestState({
        js: [js2],
        pages: [page],
        tabs: {
          [EditorEntityTab.QUERIES]: [],
          [EditorEntityTab.JS]: ["js_id2"],
        },
        ideView: EditorViewMode.SplitScreen,
      });

      const { container, getAllByText, getByRole, getByTestId } = render(
        <Route path={BUILDER_PATH}>
          <IDE />
        </Route>,
        {
          url: "/app/applicationSlug/pageSlug-page_id/edit/jsObjects/js_id2",
          initialState: state,
          featureFlags: FeatureFlags,
        },
      );

      // Check if editor is in split screen
      getByTestId("t--ide-maximize");
      getByTestId("t--widgets-editor");

      // Check if js is rendered in side by side
      expect(getAllByText("JSObject2").length).toBe(2);
      // Tabs active state
      expect(
        getByTestId("t--ide-tab-JSObject2").classList.contains("active"),
      ).toBe(true);

      // Check if the form is rendered
      expect(container.querySelector(".js-editor-tab")).not.toBeNull();
      // Check if the code and settings tabs is visible
      getByRole("tab", { name: /code/i });
      getByRole("tab", { name: /settings/i });
      // Check if run button is visible
      getByRole("button", { name: /run/i });
      // Check if the Add new button is shown
      getByTestId("t--ide-split-screen-add-button");
    });

    it("Renders JS add routes in Full Screen", () => {
      const page = PageFactory.build();
      const JS3 = JSObjectFactory.build({
        id: "js_id3",
        pageId: page.pageId,
      });
      const state = getIDETestState({
        js: [JS3],
        pages: [page],
        tabs: {
          [EditorEntityTab.QUERIES]: [],
          [EditorEntityTab.JS]: ["js_id3"],
        },
      });

      const { container, getAllByText, getByRole, getByTestId, getByText } =
        render(
          <Route path={BUILDER_PATH}>
            <IDE />
          </Route>,
          {
            url: "/app/applicationSlug/pageSlug-page_id/edit/jsObjects/js_id3/add",
            initialState: state,
            featureFlags: FeatureFlags,
          },
        );

      // There will be 2 JSObject3 text (editor tab and Editor form)
      expect(getAllByText("JSObject3").length).toEqual(2);
      // Tabs active state
      expect(
        getByTestId("t--ide-tab-JSObject3").classList.contains("active"),
      ).toBe(false);
      // Check if the form is rendered
      expect(container.querySelector(".js-editor-tab")).not.toBeNull();
      // Check if the code and settings tabs is visible
      getByRole("tab", { name: /code/i });
      getByRole("tab", { name: /settings/i });
      // Check if run button is visible
      getByRole("button", { name: /run/i });
      // Create options are rendered
      getByText(createMessage(EDITOR_PANE_TEXTS.js_blank_object_item));
      // Close button is rendered
      getByRole("button", { name: "Close pane" });
    });

    it("Renders JS add routes in Split Screen", () => {
      const page = PageFactory.build();
      const js3 = JSObjectFactory.build({ id: "js_id4", pageId: page.pageId });
      const state = getIDETestState({
        js: [js3],
        pages: [page],
        tabs: {
          [EditorEntityTab.QUERIES]: [],
          [EditorEntityTab.JS]: ["js_id4"],
        },
        ideView: EditorViewMode.SplitScreen,
      });

      const { container, getAllByText, getByRole, getByTestId, getByText } =
        render(
          <Route path={BUILDER_PATH}>
            <IDE />
          </Route>,
          {
            url: "/app/applicationSlug/pageSlug-page_id/edit/jsObjects/js_id4/add",
            initialState: state,
            featureFlags: FeatureFlags,
          },
        );

      // There will be 1 JSObject3 text ( The tab )
      expect(getAllByText("JSObject4").length).toEqual(1);
      // Tabs active state
      expect(
        getByTestId("t--ide-tab-JSObject4").classList.contains("active"),
      ).toBe(false);
      // Add button active state
      expect(
        getByTestId("t--ide-split-screen-add-button").getAttribute(
          "data-selected",
        ),
      ).toBe("true");

      // Check if the form is not rendered
      expect(container.querySelector(".js-editor-tab")).toBeNull();
      // Create options are rendered
      getByText(createMessage(EDITOR_PANE_TEXTS.js_blank_object_item));
      // Close button is rendered
      getByRole("button", { name: "Close pane" });
    });

    it("Prevents edit of main JS object", () => {
      const page = PageFactory.build();
      const Main_JS = JSObjectFactory.build({
        id: "js_id",
        name: "Main",
        pageId: page.pageId,
      });
      Main_JS.isMainJSCollection = true;

      const Normal_JS = JSObjectFactory.build({
        id: "js_id2",
        name: "Normal",
        pageId: page.pageId,
      });

      const state = getIDETestState({
        pages: [page],
        js: [Main_JS, Normal_JS],
        tabs: {
          [EditorEntityTab.QUERIES]: [],
          [EditorEntityTab.JS]: ["js_id"],
        },
      });

      const { getByTestId } = render(
        <Route path={BUILDER_PATH}>
          <IDE />
        </Route>,
        {
          url: "/app/applicationSlug/pageSlug-page_id/edit/jsObjects/js_id",
          initialState: state,
          featureFlags: FeatureFlags,
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
