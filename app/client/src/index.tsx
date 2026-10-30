// This file must be executed as early as possible to ensure the preloads are triggered ASAP
import "./preload-route-chunks";
// Initialise eval worker instance
import "utils/workerInstances";
// Populate the widget loader registry (side effect of importing the barrel).
// Consumers (EvaluationsSaga, EditorUtils) read loaders from `widgets/registry`,
// so this import is what registers them on the main thread.
import "widgets";

import React from "react";
import "./wdyr";
import ReactDOM from "react-dom";
import { connect, Provider, useDispatch, useSelector } from "react-redux";
import "./index.css";
import "@appsmith/ads-old/src/themes/default/index.css";
import "@appsmith/ads/src/__theme__/default/index.css";
import { ThemeProvider } from "styled-components";
import { appInitializer } from "utils/AppUtils";
import store, { runSagaMiddleware } from "./store";
import { LayersContext, Layers } from "constants/Layers";
import AppRouter from "ee/AppRouter";
import {
  getCurrentThemeDetails,
  getCurrentThemeMode,
  getCurrentThemePreference,
  ThemeMode,
} from "selectors/themeSelectors";
import { setThemeMode } from "actions/themeActions";
import type { DefaultRootState } from "react-redux";
import { Toast } from "@appsmith/ads";
import "./assets/styles/index.css";
import "./polyfills";
import GlobalStyles from "globalStyles";
// enable autofreeze only in development

import AppErrorBoundary from "./AppErrorBoundry";
import log from "loglevel";
import { FaroErrorBoundary } from "@grafana/faro-react";

runSagaMiddleware();

appInitializer();

const initialThemePreference = getCurrentThemePreference(store.getState());

document.documentElement.dataset.colorMode = getCurrentThemeMode(
  store.getState(),
).toLowerCase();
store.dispatch(setThemeMode(initialThemePreference));

(async () => {
  try {
    await import(/* webpackChunkName: "instrumentation" */ "./instrumentation");
  } catch (e) {
    log.error("Error loading telemetry script", e);
  }
})();

function App() {
  return (
    <FaroErrorBoundary fallback={<div>An error has occured</div>}>
      <Provider store={store}>
        <ThemeModeListener />
        <LayersContext.Provider value={Layers}>
          <ThemedAppWithProps />
        </LayersContext.Provider>
      </Provider>
    </FaroErrorBoundary>
  );
}

function ThemeModeListener() {
  const dispatch = useDispatch();
  const themePreference = useSelector(getCurrentThemePreference);
  const resolvedThemeMode = useSelector(getCurrentThemeMode);

  React.useEffect(
    function updateColorSchemeAndSystemListener() {
      document.documentElement.dataset.colorMode =
        resolvedThemeMode.toLowerCase();

      if (themePreference !== ThemeMode.SYSTEM) {
        return;
      }

      if (typeof window.matchMedia !== "function") {
        return;
      }

      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleSystemThemeChange = () => {
        dispatch(setThemeMode(ThemeMode.SYSTEM));
      };

      mediaQuery.addEventListener("change", handleSystemThemeChange);

      return () =>
        mediaQuery.removeEventListener("change", handleSystemThemeChange);
    },
    [dispatch, resolvedThemeMode, themePreference],
  );

  return null;
}

class ThemedApp extends React.Component<{
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  currentTheme: any;
}> {
  render() {
    return (
      <ThemeProvider theme={this.props.currentTheme}>
        <Toast />
        <GlobalStyles />
        <AppErrorBoundary>
          <AppRouter />
        </AppErrorBoundary>
      </ThemeProvider>
    );
  }
}
const mapStateToProps = (state: DefaultRootState) => ({
  currentTheme: getCurrentThemeDetails(state),
});

const ThemedAppWithProps = connect(mapStateToProps)(ThemedApp);

ReactDOM.render(<App />, document.getElementById("root"));

// expose store when run in Cypress
// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
if ((window as any).Cypress) {
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).store = store;
}
