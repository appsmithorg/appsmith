import type { ReactElement } from "react";
import React from "react";
import type { RenderOptions } from "@testing-library/react";
import { render, queries } from "@testing-library/react";
import { Provider } from "react-redux";
import { ThemeProvider } from "styled-components";
import { getCurrentThemeDetails } from "selectors/themeSelectors";
import * as customQueries from "./customQueries";
import { BrowserRouter } from "react-router-dom";
import type { AppState } from "ee/reducers";
import appReducer from "ee/reducers";
import { applyMiddleware, compose, createStore } from "redux";
import { reduxBatch } from "@manaflair/redux-batch";
import createSagaMiddleware from "redux-saga";
import store, { testStore } from "store";
import { sagasToRunForTests } from "./sagas";
import { all, call, spawn } from "redux-saga/effects";
import type { FeatureFlags } from "ee/entities/FeatureFlag";
import { fetchFeatureFlagsSuccess } from "../src/actions/userActions";
import { DEFAULT_FEATURE_FLAG_VALUE } from "ee/entities/FeatureFlag";

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

interface State {
  url?: string;
  initialState?: Partial<AppState>;
  sagasToRun?: typeof sagasToRunForTests;
  featureFlags?: Partial<FeatureFlags>;
}
const setupState = (state?: State) => {
  let reduxStore = store;
  window.history.pushState({}, "Appsmith", state?.url || "/");
  if (state && (state.initialState || state.featureFlags)) {
    reduxStore = testStore(state.initialState || {});
    if (state.featureFlags) {
      reduxStore.dispatch(
        fetchFeatureFlagsSuccess({
          ...DEFAULT_FEATURE_FLAG_VALUE,
          ...state.featureFlags,
        }),
      );
    }
  }
  if (state && state.sagasToRun) {
    reduxStore = testStoreWithTestMiddleWare(reduxStore.getState());
    testSagaMiddleware.run(() => rootSaga(state.sagasToRun));
  }
  const defaultTheme = getCurrentThemeDetails(reduxStore.getState());

  return { reduxStore, defaultTheme };
};

const customRender = (
  ui: ReactElement,
  state?: State,
  options?: Omit<RenderOptions, "queries">,
) => {
  const { defaultTheme, reduxStore } = setupState(state);
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

const hookWrapper = (state: State) => {
  return ({ children }: { children: ReactElement }) => {
    const { defaultTheme, reduxStore } = setupState(state);
    return (
      <BrowserRouter>
        <Provider store={reduxStore}>
          <ThemeProvider theme={defaultTheme}>{children}</ThemeProvider>
        </Provider>
      </BrowserRouter>
    );
  };
};

export * from "@testing-library/react";

export { customRender as render, hookWrapper };
