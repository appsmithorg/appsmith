import { expectSaga } from "redux-saga-test-plan";
import * as matchers from "redux-saga-test-plan/matchers";
import { delay, select } from "redux-saga/effects";
import { getAppsmithConfigs } from "ee/configs";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { getIsEditorInitialized } from "selectors/editorSelectors";
import { getCurrentUser } from "selectors/usersSelectors";
import history from "utils/history";
import { setEnableStartSignposting } from "utils/storage";
import { firstTimeUserOnboardingInitSaga } from "../OnboardingSagas";

jest.mock("ee/configs", () => {
  const actual = jest.requireActual("ee/configs");

  return {
    ...actual,
    getAppsmithConfigs: jest.fn(() => actual.getAppsmithConfigs()),
  };
});

jest.mock("utils/history", () => ({
  __esModule: true,
  default: { replace: jest.fn() },
}));

jest.mock("utils/storage", () => ({
  ...jest.requireActual("utils/storage"),
  setEnableStartSignposting: jest.fn(),
}));

jest.mock("ee/RouteBuilder", () => ({
  builderURL: () => "/app/app-slug/page-slug/edit",
}));

jest.mock("ee/utils/AnalyticsUtil", () => ({
  logEvent: jest.fn(),
}));

const mockGetAppsmithConfigs = getAppsmithConfigs as jest.Mock;
const { getAppsmithConfigs: getActualAppsmithConfigs } =
  jest.requireActual("ee/configs");

const setDisableHelpIcon = (disableHelpIcon: boolean) => {
  mockGetAppsmithConfigs.mockReturnValue({
    ...getActualAppsmithConfigs(),
    disableHelpIcon,
  });
};

// `delay` is a call effect; match its underlying function so the saga's
// 1s pause resolves immediately.
const delayFn = delay(0).payload.fn;

const initAction = {
  type: ReduxActionTypes.FIRST_TIME_USER_ONBOARDING_INIT,
  payload: { applicationId: "app-id", basePageId: "page-id" },
};

describe("firstTimeUserOnboardingInitSaga", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("skips signposting setup when the help icon is disabled", async () => {
    setDisableHelpIcon(true);

    await expectSaga(firstTimeUserOnboardingInitSaga, initAction)
      .not.put.actionType(ReduxActionTypes.SET_SIGNPOSTING_OVERLAY)
      .not.put.actionType(
        ReduxActionTypes.SET_FIRST_TIME_USER_ONBOARDING_APPLICATION_ID,
      )
      .not.put.actionType(
        ReduxActionTypes.SET_SHOW_FIRST_TIME_USER_ONBOARDING_MODAL,
      )
      .run();

    expect(history.replace).toHaveBeenCalledWith(
      "/app/app-slug/page-slug/edit",
    );
    expect(setEnableStartSignposting).not.toHaveBeenCalled();
  });

  it("sets up signposting when the help icon is enabled", async () => {
    setDisableHelpIcon(false);

    await expectSaga(firstTimeUserOnboardingInitSaga, initAction)
      .provide([
        [select(getIsEditorInitialized), true],
        [select(getCurrentUser), undefined],
        [matchers.call.fn(delayFn), null],
      ])
      .put({
        type: ReduxActionTypes.SET_FIRST_TIME_USER_ONBOARDING_APPLICATION_ID,
        payload: "app-id",
      })
      .put.actionType(ReduxActionTypes.SET_SIGNPOSTING_OVERLAY)
      .put.actionType(
        ReduxActionTypes.SET_SHOW_FIRST_TIME_USER_ONBOARDING_MODAL,
      )
      .run();

    expect(history.replace).toHaveBeenCalledWith(
      "/app/app-slug/page-slug/edit",
    );
    expect(setEnableStartSignposting).toHaveBeenCalledWith(true);
  });
});
