import React from "react";
import "./wdyr";
import ReactDOM from "react-dom";
import { Provider, useSelector } from "react-redux";
import "./index.css";
import { ThemeProvider } from "constants/DefaultTheme";
import { appInitializer } from "utils/AppsmithUtils";
import { Slide, ToastContainer } from "react-toastify";
import store from "./store";
import { LayersContext, Layers } from "constants/Layers";
import AppRouter from "./AppRouter";
import * as Sentry from "@sentry/react";
import { getThemeDetails } from "selectors/themeSelectors";

appInitializer();

const App = () => {
  return (
    <Sentry.ErrorBoundary fallback={"An error has occured"}>
      <Provider store={store}>
        <LayersContext.Provider value={Layers}>
          <ThemedApp></ThemedApp>
        </LayersContext.Provider>
      </Provider>
    </Sentry.ErrorBoundary>
  );
};

const ThemedApp = () => {
  const currentThemeDetails = useSelector(getThemeDetails);

  return (
    <ThemeProvider theme={currentThemeDetails.theme}>
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
};

ReactDOM.render(<App />, document.getElementById("root"));
