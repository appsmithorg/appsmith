import React, { ReactElement } from "react";
import { render, RenderOptions, queries } from "@testing-library/react";
import { Provider, useDispatch } from "react-redux";
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
import { initCanvasLayout } from "actions/pageActions";

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
export function SetCanvas({ dsl, children }: any) {
  const dispatch = useDispatch();
  const mockResp: any = {
    data: {
      id: "jest_test",
      name: "Mock App",
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
  dispatch(initCanvasLayout(canvasWidgetsPayload));
  return children;
}

export * from "@testing-library/react";

export { customRender as render };
