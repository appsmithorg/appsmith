import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { all, takeEvery } from "redux-saga/effects";
import navigationSagas from "sagas/NavigationSagas";
import {
  navigateToAnyPageInApplication,
  syncUrlDataWithLocation,
} from "sagas/ActionExecution/NavigateActionSaga";

jest.mock("ee/sagas/PageSagas");
jest.mock("utils/history");

describe("navigationSagas root", () => {
  it("registers the navigation watchers", () => {
    expect(navigationSagas().next().value).toEqual(
      all(
        expect.arrayContaining([
          takeEvery(
            ReduxActionTypes.NAVIGATE_TO_ANOTHER_PAGE,
            navigateToAnyPageInApplication,
          ),
          takeEvery(
            ReduxActionTypes.BROWSER_HISTORY_POPPED,
            syncUrlDataWithLocation,
          ),
        ]),
      ),
    );
  });
});
