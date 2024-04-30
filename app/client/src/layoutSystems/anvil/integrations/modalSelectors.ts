import type { AppState } from "@appsmith/reducers";
import { getWidgetIdsByType, getWidgetsMeta } from "sagas/selectors";
import { WDSModalWidget } from "widgets/wds/WDSModalWidget";

export const getCurrentlyOpenAnvilModal = (state: AppState) => {
  const allExistingModals = getWidgetIdsByType(state, WDSModalWidget.type);
  if (allExistingModals.length === 0) {
    return;
  }
  const metaWidgets = getWidgetsMeta(state);
  const currentlyOpenModal = allExistingModals.find((modalId) => {
    const modal = metaWidgets[modalId];
    return modal && modal.isVisible;
  });
  return currentlyOpenModal;
};
