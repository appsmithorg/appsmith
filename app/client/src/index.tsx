import React from "react";
import "./wdyr";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import "./index.css";
import { ThemeProvider } from "constants/DefaultTheme";
import { appInitializer } from "utils/AppUtils";
import { Slide } from "react-toastify";
import store, { runSagaMiddleware } from "./store";
import { LayersContext, Layers } from "constants/Layers";
import AppRouter from "./AppRouter";
import * as Sentry from "@sentry/react";
import { getCurrentThemeDetails } from "selectors/themeSelectors";
import { connect } from "react-redux";
import { AppState } from "@appsmith/reducers";
import { StyledToastContainer } from "design-system";
import "./assets/styles/index.css";
import "./polyfills/corejs-add-on";
import GlobalStyles from "globalStyles";
// enable autofreeze only in development
import { setAutoFreeze } from "immer";
import AppErrorBoundary from "AppErrorBoundry";
const shouldAutoFreeze = process.env.NODE_ENV === "development";
setAutoFreeze(shouldAutoFreeze);

runSagaMiddleware();

appInitializer();

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
        <StyledToastContainer
          autoClose={5000}
          closeButton={false}
          draggable={false}
          hideProgressBar
          pauseOnHover={false}
          transition={Slide}
        />
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
