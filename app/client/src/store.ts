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
  ApplicationPayload,
  Page,
  ReduxAction,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import urlBuilder from "entities/URLRedirect/URLAssembly";
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
    case ReduxActionTypes.DUPLICATE_APPLICATION_SUCCESS:
    case ReduxActionTypes.IMPORT_APPLICATION_SUCCESS:
    case ReduxActionTypes.FETCH_APPLICATION_SUCCESS: {
      const application: ApplicationPayload = action.payload;
      const { pages } = application;
      urlBuilder.updateURLParams(
        {
          applicationId: application.id,
          applicationSlug: application.slug,
          applicationVersion: application.applicationVersion,
        },
        pages.map((page) => ({
          pageSlug: page.slug,
          pageId: page.id,
          customSlug: page.customSlug,
        })),
      );
      break;
    }
    case ReduxActionTypes.FORK_APPLICATION_SUCCESS:
    case ReduxActionTypes.CREATE_APPLICATION_SUCCESS: {
      const application: ApplicationPayload = action.payload.application;
      const { pages } = application;
      urlBuilder.updateURLParams(
        {
          applicationId: application.id,
          applicationSlug: application.slug,
          applicationVersion: application.applicationVersion,
        },
        pages.map((page) => ({
          pageSlug: page.slug,
          pageId: page.id,
          customSlug: page.customSlug,
        })),
      );
      break;
    }
    case ReduxActionTypes.CURRENT_APPLICATION_NAME_UPDATE: {
      const application = action.payload;
      urlBuilder.updateURLParams({
        applicationId: application.id,
        applicationSlug: application.slug,
        applicationVersion: application.applicationVersion,
      });
      updateSlugNamesInURL({
        applicationSlug: application.slug,
      });
      break;
    }
    case ReduxActionTypes.FETCH_PAGE_LIST_SUCCESS: {
      const pages: Page[] = action.payload.pages;
      urlBuilder.updateURLParams(
        null,
        pages.map((page) => ({
          pageSlug: page.slug,
          pageId: page.pageId,
          customSlug: page.customSlug,
        })),
      );
      break;
    }
    case ReduxActionTypes.UPDATE_PAGE_SUCCESS: {
      const page: Page = action.payload;
      urlBuilder.updateURLParams(null, [
        {
          pageSlug: page.slug,
          pageId: page.pageId,
          customSlug: page.customSlug,
        },
      ]);
      //TODO: Update URL here
      break;
    }
    case ReduxActionTypes.CREATE_PAGE_SUCCESS: {
      const page: Page = action.payload;
      urlBuilder.updateURLParams(null, [
        {
          pageSlug: page.slug,
          pageId: page.pageId,
          customSlug: page.customSlug,
        },
      ]);
      break;
    }
    case ReduxActionTypes.UPDATE_APPLICATION_SUCCESS:
      const application = action.payload;
      urlBuilder.updateURLParams({
        applicationId: application.id,
        applicationSlug: application.slug,
        applicationVersion: application.applicationVersion,
      });
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
