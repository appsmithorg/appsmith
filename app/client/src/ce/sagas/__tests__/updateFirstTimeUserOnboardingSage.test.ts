import { expectSaga } from "redux-saga-test-plan";
import * as matchers from "redux-saga-test-plan/matchers";
import { getAppsmithConfigs } from "ee/configs";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { disableStartSignpostingAction } from "actions/onboardingActions";
import {
  getEnableStartSignposting,
  getFirstTimeUserOnboardingApplicationIds,
  getFirstTimeUserOnboardingIntroModalVisibility,
} from "utils/storage";
import { updateFirstTimeUserOnboardingSage } from "../userSagas";

jest.mock("ee/configs", () => {
  const actual = jest.requireActual("ee/configs");

  return {
    ...actual,
    getAppsmithConfigs: jest.fn(() => actual.getAppsmithConfigs()),
  };
});

jest.mock("utils/storage", () => ({
  ...jest.requireActual("utils/storage"),
  getEnableStartSignposting: jest.fn(),
  getFirstTimeUserOnboardingApplicationIds: jest.fn(),
  getFirstTimeUserOnboardingIntroModalVisibility: jest.fn(),
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

describe("updateFirstTimeUserOnboardingSage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getEnableStartSignposting as jest.Mock).mockResolvedValue(true);
    (getFirstTimeUserOnboardingApplicationIds as jest.Mock).mockResolvedValue([
      "app-id",
    ]);
    (
      getFirstTimeUserOnboardingIntroModalVisibility as jest.Mock
    ).mockResolvedValue(true);
  });

  it("clears stored signposting and loads nothing when the help icon is disabled", async () => {
    setDisableHelpIcon(true);

    await expectSaga(updateFirstTimeUserOnboardingSage)
      .put(disableStartSignpostingAction())
      .not.put.actionType(
        ReduxActionTypes.SET_FIRST_TIME_USER_ONBOARDING_APPLICATION_IDS,
      )
      .not.put.actionType(
        ReduxActionTypes.SET_SHOW_FIRST_TIME_USER_ONBOARDING_MODAL,
      )
      .run();
  });

  it("loads stored signposting when the help icon is enabled", async () => {
    setDisableHelpIcon(false);

    await expectSaga(updateFirstTimeUserOnboardingSage)
      .provide([[matchers.call.fn(getEnableStartSignposting), true]])
      .not.put(disableStartSignpostingAction())
      .put({
        type: ReduxActionTypes.SET_FIRST_TIME_USER_ONBOARDING_APPLICATION_IDS,
        payload: ["app-id"],
      })
      .put.actionType(
        ReduxActionTypes.SET_SHOW_FIRST_TIME_USER_ONBOARDING_MODAL,
      )
      .run();
  });
});
