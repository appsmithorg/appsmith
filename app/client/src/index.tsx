import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import "./index.css";
import App from "./App";
import Editor from "./pages/Editor";
import PageNotFound from "./pages/PageNotFound";
import * as serviceWorker from "./serviceWorker";
import { BrowserRouter, Route, Switch } from "react-router-dom";
import { createStore } from "redux";
import appReducer from "./reducers";
import WidgetBuilderRegistry from "./utils/WidgetRegistry";
import { ThemeProvider, theme } from "./constants/DefaultTheme";

WidgetBuilderRegistry.registerWidgetBuilders();
const store = createStore(appReducer);
ReactDOM.render(
  <Provider store={store}>
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        <Switch>
          <Route exact path="/" component={App} />
          <Route exact path="/builder" component={Editor} />
          <Route component={PageNotFound} />
        </Switch>
      </BrowserRouter>
    </ThemeProvider>
  </Provider>,
  document.getElementById("root")
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
