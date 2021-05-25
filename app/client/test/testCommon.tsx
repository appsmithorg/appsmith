import { getCanvasWidgetsPayload } from "sagas/PageSagas";
import { updateCurrentPage } from "actions/pageActions";
import { editorInitializer } from "utils/EditorUtils";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { initEditor } from "actions/initActions";
import { useDispatch } from "react-redux";

export const useMockDsl = (dsl: any) => {
  const dispatch = useDispatch();
  const mockResp: any = {
    data: {
      id: "page_id",
      name: "Page1",
      applicationId: "app_id",
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
    type: "UPDATE_LAYOUT",
    payload: { widgets: canvasWidgetsPayload.widgets },
  });

  dispatch(updateCurrentPage(mockResp.data.id));
};
export function MockPageDSL({ dsl, children }: any) {
  editorInitializer();
  useMockDsl(dsl);
  return children;
}
export function MockApplication({ children }: any) {
  editorInitializer();
  const dispatch = useDispatch();
  dispatch(initEditor("app_id", "page_id"));
  const mockResp: any = {
    organizationId: "org_id",
    pages: [{ id: "page_id", name: "Page1", isDefault: true }],
    id: "app_id",
    isDefault: true,
    name: "Page1",
  };
  dispatch({
    type: ReduxActionTypes.FETCH_APPLICATION_SUCCESS,
    payload: mockResp,
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
