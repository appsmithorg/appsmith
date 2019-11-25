import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import "./index.css";
import App from "./App";
import Editor from "./pages/Editor";
import PageNotFound from "./pages/common/PageNotFound";
import LoginPage from "./pages/common/LoginPage";
import AppViewer from "./pages/AppViewer";
import * as serviceWorker from "./serviceWorker";
import { Router, Route, Switch } from "react-router-dom";
import { createStore, applyMiddleware } from "redux";
import history from "./utils/history";
import appReducer from "./reducers";
import { ThemeProvider, theme } from "./constants/DefaultTheme";
import createSagaMiddleware from "redux-saga";
import { rootSaga } from "./sagas";
import { DndProvider } from "react-dnd";
// import TouchBackend from "react-dnd-touch-backend";
import HTML5Backend from "react-dnd-html5-backend";
import { appInitializer } from "./utils/AppsmithUtils";
import ProtectedRoute from "./pages/common/ProtectedRoute";
import { composeWithDevTools } from "redux-devtools-extension/logOnlyInProduction";

import {
  BASE_URL,
  BUILDER_URL,
  LOGIN_URL,
  APP_VIEW_URL,
  APPLICATIONS_URL,
} from "./constants/routes";
import Applications from "./pages/Applications";

appInitializer();

const sagaMiddleware = createSagaMiddleware();
const store = createStore(
  appReducer,
  composeWithDevTools(applyMiddleware(sagaMiddleware)),
);
sagaMiddleware.run(rootSaga);

ReactDOM.render(
  <DndProvider backend={HTML5Backend}>
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <Router history={history}>
          <Switch>
            <Route exact path={BASE_URL} component={App} />
            <ProtectedRoute path={BUILDER_URL} component={Editor} />
            <ProtectedRoute path={APP_VIEW_URL} component={AppViewer} />
            <ProtectedRoute
              exact
              path={APPLICATIONS_URL}
              component={Applications}
            />
            <Route exact path={LOGIN_URL} component={LoginPage} />
            <Route component={PageNotFound} />
          </Switch>
        </Router>
      </ThemeProvider>
    </Provider>
  </DndProvider>,
  document.getElementById("root"),
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
