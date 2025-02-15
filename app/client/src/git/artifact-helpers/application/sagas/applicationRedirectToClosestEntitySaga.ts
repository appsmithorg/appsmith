import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { APP_MODE } from "entities/App";
import { FocusEntity, identifyEntityFromPath } from "navigation/FocusEntity";
import { put, select, take } from "redux-saga/effects";
import history from "utils/history";
import type { Action } from "entities/Action";
import { getActions, getJSCollections } from "ee/selectors/entitiesSelector";
import type { JSCollectionDataState } from "ee/reducers/entityReducers/jsActionsReducer";
import { initEditorAction } from "actions/initActions";
import { getCurrentBasePageId } from "selectors/editorSelectors";
import type { GitApplicationArtifact } from "git/types";
import type {
  GitArtifactPayloadAction,
  GitAsyncSuccessPayload,
} from "git/store/types";
import { GIT_BRANCH_QUERY_KEY } from "git/constants/misc";

function* applicationRedirectToClosestEntitySaga(
  action: GitArtifactPayloadAction<
    GitAsyncSuccessPayload<GitApplicationArtifact>
  >,
) {
  const { responseData: destArtifact } = action.payload;
  const currentBasePageId: string = yield select(getCurrentBasePageId);
  const pageExists = destArtifact.pages.find(
    (page) => page.baseId === currentBasePageId,
  );
  const defaultPage = destArtifact.pages.find((page) => page.isDefault);

  const url = new URL(window.location.href);
  const { pathname } = url;
  const entityInfo = identifyEntityFromPath(pathname);

  const branchName = destArtifact?.gitApplicationMetadata?.branchName ?? "";
  const urlParams = new URLSearchParams();

  urlParams.set(GIT_BRANCH_QUERY_KEY, branchName);
  let destinationUrl = "";

  if (pageExists) {
    destinationUrl = pathname;
  } else if (defaultPage) {
    destinationUrl = pathname.replace(
      entityInfo.params.basePageId ?? "",
      defaultPage.baseId,
    );
  }

  destinationUrl += "?" + urlParams.toString();

  if (
    destinationUrl !==
    window.location.pathname + "?" + window.location.search
  ) {
    history.push(destinationUrl);
  }

  yield put(
    initEditorAction({
      basePageId: pageExists ? currentBasePageId : defaultPage?.baseId,
      branch: branchName,
      mode: APP_MODE.EDIT,
    }),
  );

  let shouldGoToHomePage = false;

  if (!pageExists && defaultPage) {
    shouldGoToHomePage = true;
  } else {
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
  }

  if (shouldGoToHomePage && defaultPage) {
    // We will replace so that the user does not go back to the 404 url
    const newUrl = destinationUrl.replace(
      entityInfo.params.basePageId ?? "",
      defaultPage.baseId,
    );

    history.replace(newUrl);
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
