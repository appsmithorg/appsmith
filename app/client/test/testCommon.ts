import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { initEditorAction } from "actions/initActions";
import { setAppMode, updateCurrentPage } from "actions/pageActions";
import { APP_MODE } from "entities/App";
import { useDispatch } from "react-redux";
import type { CanvasWidgetsReduxState } from "ee/reducers/entityReducers/canvasWidgetsReducer";
import { getCanvasWidgetsPayload } from "ee/sagas/PageSagas";
import { editorInitializer } from "utils/editor/EditorUtils";
import { extractCurrentDSL } from "utils/WidgetPropsUtils";
import type { AppState } from "ee/reducers";
import type { WidgetEntity } from "ee/entities/DataTree/types";
import urlBuilder from "ee/entities/URLRedirect/URLAssembly";
import type { FlattenedWidgetProps } from "ee/reducers/entityReducers/canvasWidgetsStructureReducer";
import type { Page } from "entities/Page";
import { useEffect, useState } from "react";
import type { FetchPageResponse } from "api/PageApi";

const pageId = "0123456789abcdef00000000";

export const useMockDsl = (dsl: unknown, mode?: APP_MODE) => {
  const dispatch = useDispatch();
  const [hasLoaded, setHasLoaded] = useState(false);

  const mockResp = {
    data: {
      id: pageId,
      pageId: pageId,
      name: "Page1",
      applicationId: "app_id",
      isDefault: true,
      isHidden: false,
      slug: "page-1",
      layouts: [
        {
          id: "layout_id",
          dsl,
          layoutOnLoadActions: [],
          layoutActions: [],
        },
      ],
      userPermissions: [
        "read:pages",
        "manage:pages",
        "create:pageActions",
        "delete:pages",
      ],
    },
  } as unknown as FetchPageResponse;

  useEffect(function loadScripts() {
    const loadMigrationScripts = async () => {
      const canvasWidgetsPayloadD = await getCanvasWidgetsPayload(mockResp);
      const currentDSL = await extractCurrentDSL({
        response: mockResp,
      });

      const currentDsl = currentDSL.dsl;
      const canvasWidgetsPayload = canvasWidgetsPayloadD.widgets;

      dispatch(setAppMode(mode || APP_MODE.EDIT));

      dispatch({
        type: ReduxActionTypes.FETCH_PAGE_DSLS_SUCCESS,
        payload: [
          {
            pageId: mockResp.data.id,
            dsl: currentDsl,
          },
        ],
      });
      const pages = [
        {
          pageName: mockResp.data.name,
          pageId: mockResp.data.id,
          basePageId: mockResp.data.id,
          isDefault: mockResp.data.isDefault,
          isHidden: !!mockResp.data.isHidden,
          slug: mockResp.data.slug,
          userPermissions: [
            "read:pages",
            "manage:pages",
            "create:pageActions",
            "delete:pages",
          ],
        },
      ] as unknown as Page[];

      dispatch({
        type: ReduxActionTypes.FETCH_PAGE_LIST_SUCCESS,
        payload: {
          pages,
          applicationId: mockResp.data.applicationId,
        },
      });
      dispatch({
        type: "UPDATE_LAYOUT",
        payload: { widgets: canvasWidgetsPayload },
      });

      dispatch(updateCurrentPage(mockResp.data.id));
      setHasLoaded(true);
    };

    loadMigrationScripts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return hasLoaded;
};

export function MockPageDSL({
  children,
  dsl,
}: {
  children: JSX.Element;
  dsl?: unknown;
}) {
  editorInitializer();

  const hasLoaded = useMockDsl(dsl);

  return hasLoaded ? children : null;
}

const getChildWidgets = (
  canvasWidgets: CanvasWidgetsReduxState,
  widgetId: string,
) => {
  const parentWidget = canvasWidgets[widgetId];

  if (parentWidget.children) {
    return parentWidget.children.map((childWidgetId) => {
      const childWidget = { ...canvasWidgets[childWidgetId] } as WidgetEntity;

      if (childWidget?.children?.length > 0) {
        childWidget.children = getChildWidgets(canvasWidgets, childWidgetId);
      }

      return childWidget;
    });
  }

  return [];
};

export const mockGetChildWidgets = (state: AppState, widgetId: string) => {
  return getChildWidgets(state.entities.canvasWidgets, widgetId);
};

export const mockGetPagePermissions = () => {
  return ["read:pages", "manage:pages", "create:pageActions", "delete:pages"];
};

export const mockCreateCanvasWidget = (
  canvasWidget: FlattenedWidgetProps,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  evaluatedWidget: WidgetEntity,
) => {
  return { ...canvasWidget };
};

export const mockGetWidgetEvalValues = (
  state: AppState,
  widgetName: string,
) => {
  return Object.values(state.entities.canvasWidgets).find(
    (widget) => widget.widgetName === widgetName,
  ) as WidgetEntity;
};

export const syntheticTestMouseEvent = (
  event: MouseEvent,
  optionsToAdd = {},
) => {
  const options = Object.entries(optionsToAdd);

  options.forEach(([key, value]) => {
    Object.defineProperty(event, key, { get: () => value });
  });

  return event;
};

export function MockApplication({ children }: { children: JSX.Element }) {
  editorInitializer();
  const dispatch = useDispatch();

  dispatch(initEditorAction({ basePageId: pageId, mode: APP_MODE.EDIT }));

  const mockResp = {
    workspaceId: "workspace_id",
    pages: [
      {
        id: pageId,
        baseId: pageId,
        pageId: pageId,
        name: "Page1",
        isDefault: true,
        slug: "page-1",
        userPermissions: [
          "read:pages",
          "manage:pages",
          "create:pageActions",
          "delete:pages",
        ],
      },
    ],
    id: "app_id",
    baseId: "app_id",
    isDefault: true,
    name: "appName",
    slug: "app-name",
    applicationVersion: 2,
  };

  urlBuilder.updateURLParams(
    {
      baseApplicationId: mockResp.baseId,
      applicationSlug: mockResp.slug,
      applicationVersion: mockResp.applicationVersion,
    },
    [
      {
        basePageId: mockResp.pages[0].baseId,
        pageSlug: mockResp.pages[0].slug,
      },
    ],
  );
  dispatch({
    type: ReduxActionTypes.FETCH_APPLICATION_SUCCESS,
    payload: mockResp,
  });
  dispatch({
    type: ReduxActionTypes.FETCH_PAGE_LIST_SUCCESS,
    payload: {
      pages: mockResp.pages,
    },
  });
  dispatch({
    type: ReduxActionTypes.SWITCH_CURRENT_PAGE_ID,
    payload: {
      id: pageId,
      slug: "page-1",
      permissions: [
        "read:pages",
        "manage:pages",
        "create:pageActions",
        "delete:pages",
      ],
    },
  });

  return children;
}

//got it from @blueprintjs/test-commons to dispatch hotkeys events
export function dispatchTestKeyboardEventWithCode(
  target: EventTarget,
  eventType: string,
  key: string,
  keyCode: number,
  shift = false,
  meta = false,
) {
  const event = document.createEvent("KeyboardEvent");

  event.initKeyboardEvent(
    eventType,
    true,
    true,
    window,
    key,
    0,
    meta,
    false,
    shift,
  );
  Object.defineProperty(event, "key", { get: () => key });
  Object.defineProperty(event, "which", { get: () => keyCode });

  target.dispatchEvent(event);
}
