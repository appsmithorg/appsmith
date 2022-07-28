import { getCanvasWidgetsPayload } from "sagas/PageSagas";
import { updateCurrentPage } from "actions/pageActions";
import { editorInitializer } from "utils/EditorUtils";
import {
  Page,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { initEditor } from "actions/initActions";
import { useDispatch } from "react-redux";
import { extractCurrentDSL } from "utils/WidgetPropsUtils";
import { setAppMode } from "actions/pageActions";
import { APP_MODE } from "entities/App";
import { createSelector } from "reselect";
import { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { getCanvasWidgets } from "selectors/entitiesSelector";

import CanvasWidgetsNormalizer from "normalizers/CanvasWidgetsNormalizer";
import { DSLWidget } from "widgets/constants";
import urlBuilder from "entities/URLRedirect/URLAssembly";

export const useMockDsl = (dsl: any) => {
  const dispatch = useDispatch();
  dispatch(setAppMode(APP_MODE.EDIT));
  const mockResp: any = {
    data: {
      id: "page_id",
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
    },
  };
  const canvasWidgetsPayload = getCanvasWidgetsPayload(mockResp);
  dispatch({
    type: ReduxActionTypes.FETCH_PAGE_DSLS_SUCCESS,
    payload: [
      {
        pageId: mockResp.data.id,
        dsl: extractCurrentDSL(mockResp),
      },
    ],
  });
  const pages: Page[] = [
    {
      pageName: mockResp.data.name,
      pageId: mockResp.data.id,
      isDefault: mockResp.data.isDefault,
      isHidden: !!mockResp.data.isHidden,
      slug: mockResp.data.slug,
    },
  ];
  dispatch({
    type: ReduxActionTypes.FETCH_PAGE_LIST_SUCCESS,
    payload: {
      pages,
      applicationId: mockResp.data.applicationId,
    },
  });
  dispatch({
    type: "UPDATE_LAYOUT",
    payload: { widgets: canvasWidgetsPayload.widgets },
  });

  dispatch(updateCurrentPage(mockResp.data.id));
};
export function MockPageDSL({ children, dsl }: any) {
  editorInitializer();
  useMockDsl(dsl);
  return children;
}

export const mockGetCanvasWidgetDsl = createSelector(
  getCanvasWidgets,
  (canvasWidgets: CanvasWidgetsReduxState): DSLWidget => {
    return CanvasWidgetsNormalizer.denormalize("0", {
      canvasWidgets,
    });
  },
);

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

export function MockApplication({ children }: any) {
  editorInitializer();
  const dispatch = useDispatch();
  dispatch(initEditor({ pageId: "page_id", mode: APP_MODE.EDIT }));
  const mockResp: any = {
    workspaceId: "workspace_id",
    pages: [{ id: "page_id", name: "Page1", isDefault: true, slug: "page-1" }],
    id: "app_id",
    isDefault: true,
    name: "appName",
    slug: "app-name",
    applicationVersion: 2,
  };
  urlBuilder.updateURLParams(
    {
      applicationId: mockResp.id,
      applicationSlug: mockResp.slug,
      applicationVersion: mockResp.applicationVersion,
    },
    [
      {
        pageId: mockResp.pages[0].id,
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
    payload: { id: "page_id", slug: "page-1" },
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
  (event as any).initKeyboardEvent(
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
