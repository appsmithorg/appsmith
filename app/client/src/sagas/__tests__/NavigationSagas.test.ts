import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { takeEvery } from "redux-saga/effects";
import navigationSagas from "sagas/NavigationSagas";
import {
  navigateToAnyPageInApplication,
  syncUrlDataWithLocation,
} from "sagas/ActionExecution/NavigateActionSaga";

jest.mock("ee/sagas/PageSagas");
jest.mock("utils/history");

describe("navigationSagas root", () => {
  it("registers the navigation watchers", () => {
    const rootEffect = navigationSagas().next().value;

    expect(rootEffect.payload).toEqual(
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
    );
  });
});
