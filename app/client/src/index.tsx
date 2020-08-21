import React from "react";
import "./wdyr";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import "./index.css";
import { ThemeProvider, theme } from "constants/DefaultTheme";
import { appInitializer } from "utils/AppsmithUtils";
import { Slide, ToastContainer } from "react-toastify";
import store from "./store";
import { LayersContext, Layers } from "constants/Layers";
import AppRouter from "./AppRouter";

appInitializer();

const App = () => {
  return (
    <Provider store={store}>
      <LayersContext.Provider value={Layers}>
        <ThemeProvider theme={theme}>
          <ToastContainer
            hideProgressBar
            draggable={false}
            transition={Slide}
            autoClose={5000}
            closeButton={false}
          />
          <AppRouter />
        </ThemeProvider>
      </LayersContext.Provider>
    </Provider>
  );
};

ReactDOM.render(<App />, document.getElementById("root"));
