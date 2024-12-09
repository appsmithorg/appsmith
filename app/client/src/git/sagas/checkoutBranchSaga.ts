import { call, put, select, take } from "redux-saga/effects";
import type { CheckoutBranchInitPayload } from "../store/actions/checkoutBranchActions";
import { GitArtifactType } from "../constants/enums";
import checkoutBranchRequest from "../requests/checkoutBranchRequest";
import type {
  CheckoutBranchRequestParams,
  CheckoutBranchResponse,
} from "../requests/checkoutBranchRequest.types";
import { gitArtifactActions } from "../store/gitArtifactSlice";
import type { GitArtifactPayloadAction } from "../store/types";

// internal dependencies
import { builderURL } from "ee/RouteBuilder";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { getActions, getJSCollections } from "ee/selectors/entitiesSelector";
import { addBranchParam } from "constants/routes";
import type { Action } from "entities/Action";
import { FocusEntity, identifyEntityFromPath } from "navigation/FocusEntity";
import { validateResponse } from "sagas/ErrorSagas";
import history from "utils/history";
import type { JSCollectionDataState } from "ee/reducers/entityReducers/jsActionsReducer";

export default function* checkoutBranchSaga(
  action: GitArtifactPayloadAction<CheckoutBranchInitPayload>,
) {
  const { artifactType, baseArtifactId, branchName } = action.payload;
  const basePayload = { artifactType, baseArtifactId };
  let response: CheckoutBranchResponse | undefined;

  try {
    const params: CheckoutBranchRequestParams = {
      branchName,
    };

    response = yield call(checkoutBranchRequest, baseArtifactId, params);
    const isValidResponse: boolean = yield validateResponse(response);

    if (response && isValidResponse) {
      if (artifactType === GitArtifactType.Application) {
        yield put(gitArtifactActions.checkoutBranchSuccess(basePayload));
        const trimmedBranch = branchName.replace(/^origin\//, "");
        const destinationHref = addBranchParam(trimmedBranch);

        const entityInfo = identifyEntityFromPath(
          destinationHref.slice(0, destinationHref.indexOf("?")),
        );

        yield put(
          gitArtifactActions.toggleGitBranchListPopup({
            ...basePayload,
            open: false,
          }),
        );
        // Check if page exists in the branch. If not, instead of 404, take them to
        // the app home page
        const existingPage = response.data.pages.find(
          (page) => page.baseId === entityInfo.params.basePageId,
        );
        const defaultPage = response.data.pages.find((page) => page.isDefault);

        if (!existingPage && defaultPage) {
          history.push(
            builderURL({
              basePageId: defaultPage.baseId,
              branch: trimmedBranch,
            }),
          );

          return;
        }

        // Page exists, so we will try to go to the destination
        history.push(destinationHref);

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
          const jsActions: JSCollectionDataState =
            yield select(getJSCollections);

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
        }
      }
    }
  } catch (error) {
    yield put(
      gitArtifactActions.checkoutBranchError({
        ...basePayload,
        error: error as string,
      }),
    );
  }
}
