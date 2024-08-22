// This file must be executed as early as possible to ensure the preloads are triggered ASAP
import React from "react";

import ReactDOM from "react-dom";

import { PageViewEvent } from "@newrelic/browser-agent/features/page_view_event";
import { PageViewTiming } from "@newrelic/browser-agent/features/page_view_timing";
import { Agent } from "@newrelic/browser-agent/loaders/agent";
import * as Sentry from "@sentry/react";
import { Layers, LayersContext } from "constants/Layers";
import AppRouter from "ee/AppRouter";
import { getAppsmithConfigs } from "ee/configs";
import type { AppState } from "ee/reducers";
import GlobalStyles from "globalStyles";
// enable autofreeze only in development
import { setAutoFreeze } from "immer";
import log from "loglevel";
import { Provider } from "react-redux";
import { connect } from "react-redux";
import { getCurrentThemeDetails } from "selectors/themeSelectors";
import { ThemeProvider } from "styled-components";
import { appInitializer } from "utils/AppUtils";

import { Toast } from "@appsmith/ads";
import "@appsmith/ads-old/src/themes/default/index.css";
import "@appsmith/ads/src/__theme__/default/index.css";

import AppErrorBoundary from "./AppErrorBoundry";
import "./assets/styles/index.css";
import "./index.css";
import "./polyfills";
import "./preload-route-chunks";
import store, { runSagaMiddleware } from "./store";
import "./wdyr";

const { newRelic } = getAppsmithConfigs();
const { enableNewRelic } = newRelic;

const newRelicBrowserAgentConfig = {
  init: {
    distributed_tracing: { enabled: true },
    privacy: { cookies_enabled: true },
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
  new Agent(
    {
      ...newRelicBrowserAgentConfig,
      features: [PageViewTiming, PageViewEvent],
    },
    // The second argument agentIdentifier is not marked as optional in its type definition.
    // Passing a null value throws an error as well. So we pass undefined.
    undefined,
  );
}

const shouldAutoFreeze = process.env.NODE_ENV === "development";

setAutoFreeze(shouldAutoFreeze);
runSagaMiddleware();

appInitializer();

enableNewRelic &&
  (async () => {
    try {
      await import(
        /* webpackChunkName: "otlpTelemetry" */ "./UITelemetry/auto-otel-web"
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
