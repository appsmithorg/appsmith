import type { ReduxAction } from "ce/constants/ReduxActionConstants";
import { ReduxActionTypes } from "ce/constants/ReduxActionConstants";
import type { EventLocation } from "utils/AnalyticsUtil";

export const oneClickBindingBuild = (
  pageId: string,
  from: EventLocation,
  datasourceId: string,
  formConfig: Record<string, any>,
): ReduxAction<{
  pageId: string;
  from: EventLocation;
  datasourceId: string;
  formConfig: Record<string, any>;
}> => ({
  type: ReduxActionTypes.BUILD_ONE_CLICK_BINDING,
  payload: { pageId, from, datasourceId, formConfig },
});
