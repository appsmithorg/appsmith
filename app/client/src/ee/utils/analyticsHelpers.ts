import AnalyticsUtil from "../../utils/AnalyticsUtil";

export const logMainJsActionExecution = (
  actionId: string,
  isSuccess: boolean,
  collectionId: string,
  isDirty: boolean,
) => {
  AnalyticsUtil.logEvent("TEST_WORKFLOW", {
    actionId,
    isSuccess,
    collectionId,
    isDirty,
  });
};
