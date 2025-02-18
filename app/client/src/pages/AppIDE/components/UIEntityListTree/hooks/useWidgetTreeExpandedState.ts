import { useCallback, useEffect, useState } from "react";
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

  useEffect(
    function handleExpandedWidgetsUpdate() {
      // Merge current expanded with new list
      // This is to ensure that the expanded widgets are not lost when the list is updated
      setExpandedWidgets((prev) => [
        ...prev,
        ...widgetsToExpand.filter((widgetId) => !prev.includes(widgetId)),
      ]);
    },
    [widgetsToExpand],
  );

  return {
    expandedWidgets,
    handleExpand,
  };
};
