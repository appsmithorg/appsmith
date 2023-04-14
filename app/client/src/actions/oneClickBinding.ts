import type { ReduxAction } from "ce/constants/ReduxActionConstants";
import { ReduxActionTypes } from "ce/constants/ReduxActionConstants";
import type { EventLocation } from "utils/AnalyticsUtil";

export const oneClickBindingBuild = (
  from: EventLocation,
  datasourceId: string,
  formConfig: Record<string, any>,
): ReduxAction<{
  from: EventLocation;
  datasourceId: string;
  formConfig: Record<string, any>;
}> => ({
  type: ReduxActionTypes.BUILD_ONE_CLICK_BINDING,
  payload: { from, datasourceId, formConfig },
});
