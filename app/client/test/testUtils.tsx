import React, { ReactElement } from "react";
import { render, RenderOptions, queries } from "@testing-library/react";
import { Provider, useDispatch, useSelector } from "react-redux";
import { ThemeProvider } from "../src/constants/DefaultTheme";
import store, { testStore } from "../src/store";
import { getCurrentThemeDetails } from "../src/selectors/themeSelectors";
import * as customQueries from "./customQueries";
import { BrowserRouter } from "react-router-dom";
import { AppState } from "reducers";
import { DndProvider } from "react-dnd";
import TouchBackend from "react-dnd-touch-backend";
import { noop } from "utils/AppsmithUtils";
import { getCanvasWidgetsPayload } from "sagas/PageSagas";
import { initCanvasLayout, updateCurrentPage } from "actions/pageActions";
import { editorInitializer } from "utils/EditorUtils";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { initEditor } from "actions/initActions";
import WidgetFactory from "utils/WidgetFactory";
import DataTreeEvaluator from "workers/DataTreeEvaluator";
import { getUnevaluatedDataTree } from "selectors/dataTreeSelectors";

const customRender = (
  ui: ReactElement,
  state?: {
    url?: string;
    initialState?: Partial<AppState>;
  },
  options?: Omit<RenderOptions, "queries">,
) => {
  let reduxStore = store;
  window.history.pushState({}, "Appsmith", state?.url || "/");
  if (state && state.initialState) {
    reduxStore = testStore(state.initialState || {});
  }
  const defaultTheme = getCurrentThemeDetails(reduxStore.getState());
  return render(
    <BrowserRouter>
      <Provider store={reduxStore}>
        <DndProvider
          backend={TouchBackend}
          options={{
            enableMouseEvents: true,
          }}
        >
          <ThemeProvider theme={defaultTheme}>{ui}</ThemeProvider>
        </DndProvider>
      </Provider>
    </BrowserRouter>,
    {
      queries: { ...queries, ...customQueries },
      ...options,
    },
  );
};

// jest events doesnt seem to be handling scrollTo
Element.prototype.scrollTo = noop;
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
  const tree = useSelector(getUnevaluatedDataTree);
  const widgetTypeConfigMap = WidgetFactory.getWidgetTypeConfigMap();
  const dataTreeEvaluator = new DataTreeEvaluator(widgetTypeConfigMap);
  // dataTreeEvaluator.createFirstTree(tree);
  // const dataTree = dataTreeEvaluator.evalTree;
  // dispatch({
  //   type: ReduxActionTypes.SET_EVALUATED_TREE,
  //   payload: dataTree,
  // });
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

export * from "@testing-library/react";

export { customRender as render };
