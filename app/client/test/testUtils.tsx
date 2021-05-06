import React, { ReactElement } from "react";
import { render, RenderOptions, queries } from "@testing-library/react";
import { Provider } from "react-redux";
import { ThemeProvider } from "../src/constants/DefaultTheme";
import store, { testStore } from "../src/store";
import { getCurrentThemeDetails } from "../src/selectors/themeSelectors";
import * as customQueries from "./customQueries";
import { BrowserRouter } from "react-router-dom";
import { AppState } from "reducers";
import { DndProvider } from "react-dnd";
import TouchBackend from "react-dnd-touch-backend";

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

export * from "@testing-library/react";

export { customRender as render };
