import { runSaga } from "redux-saga";
import { AppIDEFocusStrategy } from "./AppIDEFocusStrategy";
import { NavigationMethod } from "utils/history";
import { getIDETestState } from "test/factories/AppIDEFactoryUtils";
import { all, take } from "redux-saga/effects";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";

const basePageId1 = "0123456789abcdef00000000";
const basePageId2 = "0123456789abcdef00000001";

describe("AppIDEFocusStrategy", () => {
  describe("getEntitiesForSet", () => {
    it("returns empty set for App Navigation", async () => {
      const result = await runSaga(
        {
          getState: () => ({ state: "test" }),
        },
        AppIDEFocusStrategy.getEntitiesForSet,
        "",
        "",
        { invokedBy: NavigationMethod.AppNavigation },
      ).toPromise();

      expect(result).toEqual([]);
    });

    it("returns empty set if the user is going from Canvas to a widget list", async () => {
      const result = await runSaga(
        {
          getState: () => ({ state: "test" }),
        },
        AppIDEFocusStrategy.getEntitiesForSet,
        `/app/appSlug/pageSlug-${basePageId1}/edit`,
        `/app/appSlug/pageSlug-${basePageId1}/edit/widgets`,
        { invokedBy: NavigationMethod.EntityExplorer },
      ).toPromise();

      expect(result).toEqual([]);
    });

    it("returns empty set if the user is going to widget to canvas", async () => {
      const result = await runSaga(
        {
          getState: () => ({ state: "test" }),
        },
        AppIDEFocusStrategy.getEntitiesForSet,
        `/app/appSlug/pageSlug-${basePageId1}/edit/widgets/1`,
        `/app/appSlug/pageSlug-${basePageId1}/edit/widgets`,
        { invokedBy: undefined },
      ).toPromise();

      expect(result).toEqual([]);

      // But if the page has changed, we will restore state
      const state = getIDETestState({ branch: "main" });
      const resultForPageChange = await runSaga(
        {
          getState: () => state,
        },
        AppIDEFocusStrategy.getEntitiesForSet,
        `/app/appSlug/pageSlug-${basePageId1}/edit/widgets/1`,
        `/app/appSlug/pageSlug-${basePageId2}/edit/widgets`,
        { invokedBy: undefined },
      ).toPromise();

      expect(resultForPageChange).toEqual([
        {
          entityInfo: {
            appState: "EDITOR",
            entity: "WIDGET_LIST",
            id: "",
            params: {
              applicationSlug: "appSlug",
              entity: "widgets",
              basePageId: basePageId2,
              pageSlug: "pageSlug-",
            },
          },
          key: `/app/appSlug/pageSlug-${basePageId2}/edit/widgets#main`,
        },
      ]);
    });

    it("adds editor state entry if the appState or pageId", async () => {
      const state = getIDETestState({ branch: "main" });
      const appStateChangeResult = await runSaga(
        {
          getState: () => state,
        },
        AppIDEFocusStrategy.getEntitiesForSet,
        `/app/appSlug/pageSlug-${basePageId1}/edit/datasource/data_id`,
        `/app/appSlug/pageSlug-${basePageId1}/edit`,
        { invokedBy: undefined },
      ).toPromise();

      expect(appStateChangeResult).toContainEqual({
        entityInfo: {
          appState: "EDITOR",
          entity: "EDITOR",
          id: `EDITOR.${basePageId1}`,
          params: {},
        },
        key: `EDITOR_STATE.${basePageId1}#main`,
      });

      const pageIdChangeResult = await runSaga(
        {
          getState: () => state,
        },
        AppIDEFocusStrategy.getEntitiesForSet,
        `/app/appSlug/pageSlug-${basePageId1}/edit/widgets/1`,
        `/app/appSlug/pageSlug-${basePageId2}/edit`,
        { invokedBy: undefined },
      ).toPromise();

      expect(pageIdChangeResult).toContainEqual({
        entityInfo: {
          appState: "EDITOR",
          entity: "EDITOR",
          id: `EDITOR.${basePageId2}`,
          params: {},
        },
        key: `EDITOR_STATE.${basePageId2}#main`,
      });
    });

    it("adds the current entity to set state", async () => {
      const state = getIDETestState({ branch: "main" });
      const appStateChangeResult = await runSaga(
        {
          getState: () => state,
        },
        AppIDEFocusStrategy.getEntitiesForSet,
        `/app/appSlug/pageSlug-${basePageId1}/edit/datasource/data_id`,
        `/app/appSlug/pageSlug-${basePageId1}/edit/datasource/data_id2`,
        { invokedBy: undefined },
      ).toPromise();

      expect(appStateChangeResult).toEqual([
        {
          entityInfo: {
            appState: "DATA",
            entity: "DATASOURCE",
            id: "data_id2",
            params: {
              applicationSlug: "appSlug",
              datasourceId: "data_id2",
              basePageId: basePageId1,
              pageSlug: "pageSlug-",
            },
          },
          key: `/app/appSlug/pageSlug-${basePageId1}/edit/datasource/data_id2#main`,
        },
      ]);
    });
  });

  describe("getEntitiesForStore", () => {
    const state = getIDETestState({ branch: "main" });

    it("stores state of parent as well", async () => {
      const result = await runSaga(
        {
          getState: () => state,
        },
        AppIDEFocusStrategy.getEntitiesForStore,
        `/app/appSlug/pageSlug-${basePageId1}/edit/datasource/data_id`,
        `/app/appSlug/pageSlug-${basePageId1}/edit/datasource/data_id2`,
      ).toPromise();

      expect(result).toContainEqual({
        entityInfo: expect.objectContaining({
          appState: "DATA",
          entity: "DATASOURCE_LIST",
        }),
        key: expect.stringContaining("edit/datasource#main"),
      });
    });

    it("if user is in editor, it will store the editor state", async () => {
      const result = await runSaga(
        {
          getState: () => state,
        },
        AppIDEFocusStrategy.getEntitiesForStore,
        `/app/appSlug/pageSlug-${basePageId1}/edit/jsObjects/js_id`,
        `/app/appSlug/pageSlug-${basePageId1}/edit/widgets/widget_id`,
      ).toPromise();

      expect(result).toContainEqual({
        entityInfo: expect.objectContaining({
          appState: "EDITOR",
          entity: "EDITOR",
        }),
        key: `EDITOR_STATE.${basePageId1}#main`,
      });
    });

    it("adds an entity to store only if it is not a parent entity", async () => {
      const result = await runSaga(
        {
          getState: () => state,
        },
        AppIDEFocusStrategy.getEntitiesForStore,
        `/app/appSlug/pageSlug-${basePageId1}/edit/jsObjects`,
        `/app/appSlug/pageSlug-${basePageId1}/edit/jsObjects/js_id`,
      ).toPromise();

      expect(result).not.toContainEqual({
        entityInfo: expect.not.objectContaining({
          entity: "JS_OBJECT_LIST",
        }),
        key: expect.stringContaining("edit#main"),
      });

      const resultWithNoParent = await runSaga(
        {
          getState: () => state,
        },
        AppIDEFocusStrategy.getEntitiesForStore,
        `/app/appSlug/pageSlug-${basePageId1}/edit/jsObjects/js_id2`,
        `/app/appSlug/pageSlug-${basePageId1}/edit/jsObjects/js_id`,
      ).toPromise();

      expect(resultWithNoParent).toContainEqual({
        entityInfo: expect.objectContaining({
          entity: "JS_OBJECT",
          id: "js_id2",
        }),
        key: expect.stringContaining("edit/jsObjects/js_id2#main"),
      });
    });
  });

  describe("Wait for Path Load", () => {
    it("waits for page fetch success when page changes", () => {
      const pageChangeGen = AppIDEFocusStrategy.waitForPathLoad(
        `/app/appSlug/pageSlug1-${basePageId1}/edit`,
        `/app/appSlug/pageSlug2-${basePageId2}/edit`,
      );

      expect(pageChangeGen.next().value).toEqual(
        take(ReduxActionTypes.FETCH_PAGE_SUCCESS),
      );
    });

    it("does not wait for page fetch success when page does not change", () => {
      const pageChangeGen = AppIDEFocusStrategy.waitForPathLoad(
        `/app/appSlug/pageSlug1-${basePageId1}/edit/widgets/1`,
        `/app/appSlug/pageSlug1-${basePageId1}/edit/widgets/2`,
      );

      expect(pageChangeGen.next().value).toEqual(undefined);
    });

    it("waits for actions and plugins to be loaded in case of first page load", () => {
      const pageChangeGen = AppIDEFocusStrategy.waitForPathLoad(
        "/app/appSlug/pageSlug-pageId/edit/api/actionId",
        "",
      );

      expect(pageChangeGen.next().value).toEqual(
        all([
          take(ReduxActionTypes.FETCH_ACTIONS_SUCCESS),
          take(ReduxActionTypes.FETCH_PLUGINS_SUCCESS),
        ]),
      );
    });
  });
});
