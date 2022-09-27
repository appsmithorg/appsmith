import React from "react";
import "./wdyr";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import "./index.css";
import { ThemeProvider } from "constants/DefaultTheme";
import { appInitializer } from "utils/AppUtils";
import { Slide } from "react-toastify";
import store from "./store";
import { LayersContext, Layers } from "constants/Layers";
import AppRouter from "./AppRouter";
import * as Sentry from "@sentry/react";
import { getCurrentThemeDetails, ThemeMode } from "selectors/themeSelectors";
import { connect } from "react-redux";
import { AppState } from "@appsmith/reducers";
import { setThemeMode } from "actions/themeActions";
import { StyledToastContainer } from "components/ads/Toast";
import localStorage from "utils/localStorage";
import "./assets/styles/index.css";
import "./polyfills/corejs-add-on";
import GlobalStyles from "globalStyles";
import AppCrashImage from "assets/images/404-image.png";
// enable autofreeze only in development
import { setAutoFreeze } from "immer";
import AppErrorBoundary from "AppErrorBoundry";
import styled from "styled-components";
const shouldAutoFreeze = process.env.NODE_ENV === "development";
setAutoFreeze(shouldAutoFreeze);

appInitializer();

if (process.env.NODE_ENV === "development") {
  import("./mocks/browser").then(({ worker }) => {
    worker.start();
  });
}

const RetryButton = styled.button`
  background-color: #f3672a;
  color: white;
  height: 40px;
  width: 300px;
  border: none;
  cursor: pointer;
  font-weight: 600;
  font-size: 17px;
`;

function App() {
  return (
    <Sentry.ErrorBoundary
      fallback={
        <div>
          <img alt="App crashed" src={AppCrashImage} />
          <div>
            <p className="bold-text">Oops! Something went wrong</p>
            <p>
              Please try again using the button below. <br />
              If the issue persists, please contact us
            </p>
            <RetryButton onClick={() => window.location.reload()}>
              {"Retry"}
            </RetryButton>
          </div>
        </div>
      }
    >
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
  setTheme: (themeMode: ThemeMode) => void;
}> {
  componentDidMount() {
    if (localStorage.getItem("THEME") === "LIGHT") {
      this.props.setTheme(ThemeMode.LIGHT);
    }
  }
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
const mapDispatchToProps = (dispatch: any) => ({
  setTheme: (mode: ThemeMode) => {
    dispatch(setThemeMode(mode));
  },
});

const ThemedAppWithProps = connect(
  mapStateToProps,
  mapDispatchToProps,
)(ThemedApp);

ReactDOM.render(<App />, document.getElementById("root"));

// expose store when run in Cypress
if ((window as any).Cypress) {
  (window as any).store = store;
}
