import { useCallback, useState } from "react";
import { useSelector } from "react-redux";
import { getEntityExplorerWidgetsToExpand } from "selectors/widgetSelectors";

export const useWidgetTreeState = () => {
  const widgetsToExpand = useSelector(getEntityExplorerWidgetsToExpand);
  const [expandedWidgets, setExpandedWidgets] =
    useState<string[]>(widgetsToExpand);

  const handleExpand = useCallback((id: string) => {
    setExpandedWidgets((prev) =>
      prev.includes(id)
        ? prev.filter((widgetId) => widgetId !== id)
        : [...prev, id],
    );
  }, []);

  return {
    expandedWidgets,
    handleExpand,
  };
};
