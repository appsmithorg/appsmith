// This file must be executed as early as possible to ensure the preloads are triggered ASAP
import "./preload-route-chunks";
// Initialise eval worker instance
import "utils/workerInstances";

import React from "react";
import "./wdyr";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import "./index.css";
import "@appsmith/ads-old/src/themes/default/index.css";
import "@appsmith/ads/src/__theme__/default/index.css";
import { ThemeProvider } from "styled-components";
import { appInitializer } from "utils/AppUtils";
import store, { runSagaMiddleware } from "./store";
import { LayersContext, Layers } from "constants/Layers";
import AppRouter from "ee/AppRouter";
import { getCurrentThemeDetails } from "selectors/themeSelectors";
import { connect } from "react-redux";
import type { AppState } from "ee/reducers";
import { Toast } from "@appsmith/ads";
import "./assets/styles/index.css";
import "./polyfills";
import GlobalStyles from "globalStyles";
// enable autofreeze only in development
import { setAutoFreeze } from "immer";
import AppErrorBoundary from "./AppErrorBoundry";
import log from "loglevel";
import { FaroErrorBoundary } from "@grafana/faro-react";
import { isTracingEnabled } from "instrumentation/utils";
//
const shouldAutoFreeze = process.env.NODE_ENV === "development";

setAutoFreeze(shouldAutoFreeze);
runSagaMiddleware();

appInitializer();

isTracingEnabled() &&
  (async () => {
    try {
      await import(
        /* webpackChunkName: "instrumentation" */ "./instrumentation"
      );
    } catch (e) {
      log.error("Error loading telemetry script", e);
    }
  })();

function App() {
  return (
    <FaroErrorBoundary fallback={<div>An error has occured</div>}>
      <Provider store={store}>
        <LayersContext.Provider value={Layers}>
          <ThemedAppWithProps />
        </LayersContext.Provider>
      </Provider>
    </FaroErrorBoundary>
  );
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
const mapStateToProps = (state: AppState) => ({
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
