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
