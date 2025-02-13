import type { FetchApplicationResponse } from "ee/api/ApplicationApi";
import { builderURL } from "ee/RouteBuilder";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { APP_MODE } from "entities/App";
import { take } from "lodash";
import { FocusEntity, identifyEntityFromPath } from "navigation/FocusEntity";
import { call, put, select } from "redux-saga/effects";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import history from "utils/history";
import PageApi from "api/PageApi";
import type { Action } from "entities/Action";
import { getActions, getJSCollections } from "ee/selectors/entitiesSelector";
import type { JSCollectionDataState } from "ee/reducers/entityReducers/jsActionsReducer";
import { initEditorAction, resetEditorRequest } from "actions/initActions";

function* applicationRedirectToClosestEntitySaga(destinationUrl: string) {
  const currentApplicationId: string = yield select(getCurrentApplicationId);
  const params = {
    applicationId: currentApplicationId,
    mode: APP_MODE.EDIT,
  };
  const response: FetchApplicationResponse = yield call(
    PageApi.fetchAppAndPages,
    params,
  );

  // Check if page exists in the branch. If not, instead of 404, take them to the app home page
  const url = new URL(destinationUrl);
  const { pathname, searchParams } = url;
  const branchName = searchParams.get("branch") as string;
  const entityInfo = identifyEntityFromPath(pathname);
  const pageExists = response.data.pages.find(
    (page) => page.baseId === entityInfo.params.basePageId,
  );
  const defaultPage = response.data.pages.find((page) => page.isDefault);

  yield put(resetEditorRequest());

  // page does not exist, so redirect to the default page
  if (!pageExists && defaultPage) {
    history.push(
      builderURL({
        basePageId: defaultPage.baseId,
        branch: branchName,
      }),
    );

    yield put(
      initEditorAction({
        basePageId: defaultPage.baseId,
        branch: branchName,
        mode: APP_MODE.EDIT,
      }),
    );

    return;
  }

  // Page exists, so we will try to go to the destination
  history.push(
    builderURL({
      basePageId: pageExists?.baseId,
      branch: branchName,
    }),
  );

  yield put(
    initEditorAction({
      basePageId: pageExists?.baseId,
      branch: branchName,
      mode: APP_MODE.EDIT,
    }),
  );

  let shouldGoToHomePage = false;

  // It is possible that the action does not exist in the incoming branch
  // so here instead of showing the 404 page, we will navigate them to the
  // home page
  if ([FocusEntity.API, FocusEntity.QUERY].includes(entityInfo.entity)) {
    // Wait for fetch actions success, check if action id in actions state
    // or else navigate to home
    yield take(ReduxActionTypes.FETCH_ACTIONS_SUCCESS);
    const actions: Action[] = yield select(getActions);

    if (!actions.find((action) => action.id === entityInfo.id)) {
      shouldGoToHomePage = true;
    }
  }

  // Same for JS Objects
  if (entityInfo.entity === FocusEntity.JS_OBJECT) {
    yield take(ReduxActionTypes.FETCH_JS_ACTIONS_SUCCESS);
    const jsActions: JSCollectionDataState = yield select(getJSCollections);

    if (!jsActions.find((action) => action.config.id === entityInfo.id)) {
      shouldGoToHomePage = true;
    }
  }

  if (shouldGoToHomePage && defaultPage) {
    // We will replace so that the user does not go back to the 404 url
    history.replace(
      builderURL({
        basePageId: defaultPage.baseId,
        persistExistingParams: true,
      }),
    );

    yield put(
      initEditorAction({
        basePageId: defaultPage.baseId,
        branch: branchName,
        mode: APP_MODE.EDIT,
      }),
    );
  }
}

export default applicationRedirectToClosestEntitySaga;
