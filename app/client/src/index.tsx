// This file must be executed as early as possible to ensure the preloads are triggered ASAP
import "./preload-route-chunks";

import React, { useEffect } from "react";
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
import "./i18n";
import { getLocalStorageItem } from "pages/Editor/AppSettingsPane/AppSettings/LocaleSettings/localStorage/localStorageHelper";
import {
  LS_CURRENT_LOCALE_NAME,
  LS_LOCALE_OBJECT,
} from "pages/Editor/AppSettingsPane/AppSettings/LocaleSettings/localStorage/constants";
import i18n from "i18next";

const shouldAutoFreeze = process.env.NODE_ENV === "development";

setAutoFreeze(shouldAutoFreeze);
runSagaMiddleware();

appInitializer();

function App() {
  useEffect(() => {
    const currentLocale = getLocalStorageItem(LS_CURRENT_LOCALE_NAME);
    if (currentLocale) {
      const localeObj = getLocalStorageItem(LS_LOCALE_OBJECT);
      if (currentLocale in localeObj) {
        i18n.addResourceBundle(
          currentLocale,
          "translation",
          localeObj[currentLocale],
        );
        i18n.changeLanguage(currentLocale);
      }
    }
  }, []);
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
