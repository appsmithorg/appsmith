import type { ReactElement } from "react";
import React from "react";
import type { RenderOptions } from "@testing-library/react";
import { render, queries } from "@testing-library/react";
import { Provider } from "react-redux";
import { ThemeProvider } from "styled-components";
import { getCurrentThemeDetails } from "selectors/themeSelectors";
import * as customQueries from "./customQueries";
import { BrowserRouter } from "react-router-dom";
import type { AppState } from "@appsmith/reducers";
import appReducer from "@appsmith/reducers";
import { applyMiddleware, compose, createStore } from "redux";
import { reduxBatch } from "@manaflair/redux-batch";
import createSagaMiddleware from "redux-saga";
import store, { testStore } from "store";
import { sagasToRunForTests } from "./sagas";
import { all, call, spawn } from "redux-saga/effects";

const testSagaMiddleware = createSagaMiddleware();

const testStoreWithTestMiddleWare = (initialState: Partial<AppState>) =>
  createStore(
    appReducer,
    initialState,
    compose(reduxBatch, applyMiddleware(testSagaMiddleware), reduxBatch),
  );

const rootSaga = function* (sagasToRun = sagasToRunForTests) {
  yield all(
    sagasToRun.map((saga) =>
      spawn(function* () {
        while (true) {
          yield call(saga);
          break;
        }
      }),
    ),
  );
};

const customRender = (
  ui: ReactElement,
  state?: {
    url?: string;
    initialState?: Partial<AppState>;
    sagasToRun?: typeof sagasToRunForTests;
  },
  options?: Omit<RenderOptions, "queries">,
) => {
  let reduxStore = store;
  window.history.pushState({}, "Appsmith", state?.url || "/");
  if (state && state.initialState) {
    reduxStore = testStore(state.initialState || {});
  }
  if (state && state.sagasToRun) {
    reduxStore = testStoreWithTestMiddleWare(reduxStore.getState());
    testSagaMiddleware.run(() => rootSaga(state.sagasToRun));
  }
  const defaultTheme = getCurrentThemeDetails(reduxStore.getState());
  return render(
    <BrowserRouter>
      <Provider store={reduxStore}>
        <ThemeProvider theme={defaultTheme}>{ui}</ThemeProvider>
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
