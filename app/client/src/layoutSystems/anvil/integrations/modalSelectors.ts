import type { DefaultRootState } from "react-redux";
import memoize from "micro-memoize";
import { getAllDetachedWidgetIds, getWidgetsMeta } from "sagas/selectors";

const getCurrentlyOpenWidgets = memoize(
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (allExistingDetachedWidgets: string[], metaWidgets: Record<string, any>) => {
    return allExistingDetachedWidgets.filter((detachedWidgetId) => {
      const detachedWidget = metaWidgets[detachedWidgetId];

      return detachedWidget && detachedWidget.isVisible;
    });
  },
);

export const getCurrentlyOpenAnvilDetachedWidgets = (
  state: DefaultRootState,
) => {
  const allExistingDetachedWidgets = getAllDetachedWidgetIds(
    state.entities.canvasWidgets,
  );

  if (allExistingDetachedWidgets.length === 0) {
    return [];
  }

  const metaWidgets = getWidgetsMeta(state);
  const currentlyOpenWidgets = getCurrentlyOpenWidgets(
    allExistingDetachedWidgets,
    metaWidgets,
  );

  return currentlyOpenWidgets;
};
