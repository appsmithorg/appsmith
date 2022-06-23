import { reduxBatch } from "@manaflair/redux-batch";
import { createStore, applyMiddleware, compose, Middleware } from "redux";
import {
  useSelector as useReduxSelector,
  TypedUseSelectorHook,
} from "react-redux";
import appReducer, { AppState } from "./reducers";
import createSagaMiddleware from "redux-saga";
import { rootSaga } from "sagas";
import { composeWithDevTools } from "redux-devtools-extension/logOnlyInProduction";
import * as Sentry from "@sentry/react";
import {
  ReduxAction,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import urlBuilder from "entities/URLGenerator/URLAssembly";
import { updateSlugNamesInURL } from "utils/helpers";

const sagaMiddleware = createSagaMiddleware();
const sentryReduxEnhancer = Sentry.createReduxEnhancer({
  actionTransformer: (action) => {
    if (
      action.type === ReduxActionTypes.SET_EVALUATED_TREE ||
      action.type === ReduxActionTypes.EXECUTE_PLUGIN_ACTION_SUCCESS
    ) {
      // Return null to not log the action to Sentry
      action.payload = null;
    }
    return action;
  },
});

const routeParamsMiddleware: Middleware = () => (next: any) => (
  action: ReduxAction<any>,
) => {
  switch (action.type) {
    case ReduxActionTypes.FETCH_APPLICATION_SUCCESS: {
      urlBuilder.updateURLParams(action.payload);
      break;
    }
    case ReduxActionTypes.CURRENT_APPLICATION_NAME_UPDATE: {
      const { slug } = action.payload;
      urlBuilder.updateURLParams(action.payload);
      updateSlugNamesInURL({
        applicationSlug: slug,
      });
      break;
    }
    // case ReduxActionTypes.SWITCH_CURRENT_PAGE_ID: {
    //   const id = action.payload.id;
    //   const slug = action.payload.slug;
    //   URLParamsFactory.updateURLParams({ pageId: id, pageSlug: slug });
    //   break;
    // }
    case ReduxActionTypes.UPDATE_PAGE_SUCCESS: {
      const id = action.payload.id;
      urlBuilder.updateURLParams(null, [{ ...action.payload, pageId: id }]);
      // Update route params and page slug in URL only if the current page is updated
      // if (pageId === id) {
      //   updateSlugNamesInURL({
      //     pageSlug: slug,
      //     customSlug,
      //   });
      // }
      break;
    }
    case ReduxActionTypes.UPDATE_APPLICATION_SUCCESS:
      urlBuilder.updateURLParams(action.payload);
      break;
    default:
      break;
  }
  return next(action);
};

export default createStore(
  appReducer,
  composeWithDevTools(
    reduxBatch,
    applyMiddleware(sagaMiddleware, routeParamsMiddleware),
    reduxBatch,
    sentryReduxEnhancer,
  ),
);

export const testStore = (initialState: Partial<AppState>) =>
  createStore(
    appReducer,
    initialState,
    compose(
      reduxBatch,
      applyMiddleware(sagaMiddleware, routeParamsMiddleware),
      reduxBatch,
    ),
  );

sagaMiddleware.run(rootSaga);

export const useSelector: TypedUseSelectorHook<AppState> = useReduxSelector;
