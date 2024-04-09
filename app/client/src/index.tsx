// This file must be executed as early as possible to ensure the preloads are triggered ASAP
import "./preload-route-chunks";

import React from "react";
import "./wdyr";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import "./index.css";
import { ThemeProvider } from "styled-components";
import { appInitializer } from "utils/AppUtils";
import store, { runSagaMiddleware } from "./store";
import { LayersContext, Layers } from "constants/Layers";
import AppRouter from "@appsmith/AppRouter";
import * as Sentry from "@sentry/react";
import { getCurrentThemeDetails } from "selectors/themeSelectors";
import { connect } from "react-redux";
import type { AppState } from "@appsmith/reducers";
import { Toast } from "design-system";
import "./assets/styles/index.css";
import "./polyfills";
import GlobalStyles from "globalStyles";
// enable autofreeze only in development
import { setAutoFreeze } from "immer";
import AppErrorBoundary from "./AppErrorBoundry";
import log from "loglevel";
import { getAppsmithConfigs } from "@appsmith/configs";
import { BrowserAgent } from "@newrelic/browser-agent/loaders/browser-agent";

const { newRelic } = getAppsmithConfigs();
const { enableNewRelic } = newRelic;

const newRelicBrowserAgentConfig = {
  init: {
    distributed_tracing: { enabled: true },
    privacy: { cookies_enabled: true },
    ajax: { deny_list: [newRelic.browserAgentEndpoint] },
  },
  info: {
    beacon: newRelic.browserAgentEndpoint,
    errorBeacon: newRelic.browserAgentEndpoint,
    licenseKey: newRelic.browserAgentlicenseKey,
    applicationID: newRelic.applicationId,
    sa: 1,
  },
  loader_config: {
    accountID: newRelic.accountId,
    trustKey: newRelic.accountId,
    agentID: newRelic.applicationId,
    licenseKey: newRelic.browserAgentlicenseKey,
    applicationID: newRelic.applicationId,
  },
};

// The agent loader code executes immediately on instantiation.
if (enableNewRelic) {
  new BrowserAgent(newRelicBrowserAgentConfig);
}

const shouldAutoFreeze = process.env.NODE_ENV === "development";

setAutoFreeze(shouldAutoFreeze);
runSagaMiddleware();

appInitializer();

enableNewRelic &&
  (async () => {
    try {
      await import(
        /* webpackChunkName: "otlpTelemetry" */ "./UITelemetry/auto-otel-web.js"
      );
    } catch (e) {
      log.error("Error loading telemetry script", e);
    }
  })();

function App() {
  return (
    <Sentry.ErrorBoundary fallback={"An error has occured"}>
      <Provider store={store}>
        <LayersContext.Provider value={Layers}>
          <ThemedAppWithProps />
        </LayersContext.Provider>
      </Provider>
    </Sentry.ErrorBoundary>
  );
}

class ThemedApp extends React.Component<{
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
if ((window as any).Cypress) {
  (window as any).store = store;
}
