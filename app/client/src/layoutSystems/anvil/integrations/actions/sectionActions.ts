import { AnvilReduxActionTypes } from "./actionTypes";

export const updateZoneCountAction = (
  sectionWidgetId: string,
  zoneCount: number,
) => {
  return {
    type: AnvilReduxActionTypes.ANVIL_SECTION_ZONES_UPDATE,
    payload: {
      sectionWidgetId,
      zoneCount,
    },
  };
};

export const checkSectionAutoDeleteAction = (widgetId: string) => {
  return {
    type: AnvilReduxActionTypes.ANVIL_CHECK_SECTION_DELETE,
    payload: {
      widgetId,
    },
  };
};

export const checkSectionZoneCountAction = (widgetId: string) => {
  return {
    type: AnvilReduxActionTypes.ANVIL_CHECK_ZONE_COUNT,
    payload: {
      widgetId,
    },
  };
};

