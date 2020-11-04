import React from "react";
import "./wdyr";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import "./index.css";
import { ThemeProvider } from "constants/DefaultTheme";
import { appInitializer } from "utils/AppsmithUtils";
import { Slide, ToastContainer } from "react-toastify";
import store from "./store";
import { LayersContext, Layers } from "constants/Layers";
import AppRouter from "./AppRouter";
import * as Sentry from "@sentry/react";
import { getThemeDetails } from "selectors/themeSelectors";
import { connect } from "react-redux";
import { AppState } from "reducers";
import { setThemeMode } from "actions/themeActions";
import { ThemeMode } from "reducers/uiReducers/themeReducer";
appInitializer();

const App = () => {
  return (
    <Sentry.ErrorBoundary fallback={"An error has occurred"}>
      <Provider store={store}>
        <LayersContext.Provider value={Layers}>
          <ThemedAppWithProps />
        </LayersContext.Provider>
      </Provider>
    </Sentry.ErrorBoundary>
  );
};

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
        <ToastContainer
          hideProgressBar
          draggable={false}
          transition={Slide}
          autoClose={5000}
          closeButton={false}
        />
        <AppRouter />
      </ThemeProvider>
    );
  }
}
const mapStateToProps = (state: AppState) => ({
  currentTheme: getThemeDetails(state).theme,
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
