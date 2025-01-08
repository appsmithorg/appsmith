import { useCallback, type MouseEvent } from "react";
import type { CanvasStructure } from "reducers/uiReducers/pageCanvasStructureReducer";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { builderURL } from "ee/RouteBuilder";
import { NavigationMethod } from "utils/history";
import { useNavigateToWidget } from "pages/Editor/Explorer/Widgets/useNavigateToWidget";
import { useSelector } from "react-redux";
import { getCurrentBasePageId } from "selectors/editorSelectors";
import { getSelectedWidgets } from "selectors/ui";

export function useSwitchToWidget() {
  const { navigateToWidget } = useNavigateToWidget();
  const basePageId = useSelector(getCurrentBasePageId) as string;
  const selectedWidgets = useSelector(getSelectedWidgets);

  return useCallback(
    (e: MouseEvent, widget: CanvasStructure) => {
      const isMultiSelect = e.metaKey || e.ctrlKey;
      const isShiftSelect = e.shiftKey;

      AnalyticsUtil.logEvent("ENTITY_EXPLORER_CLICK", {
        type: "WIDGETS",
        fromUrl: location.pathname,
        toUrl: `${builderURL({
          basePageId,
          hash: widget.widgetId,
        })}`,
        name: widget.widgetName,
      });
      navigateToWidget(
        widget.widgetId,
        widget.type,
        basePageId,
        NavigationMethod.EntityExplorer,
        selectedWidgets.includes(widget.widgetId),
        isMultiSelect,
        isShiftSelect,
      );
    },
    [basePageId, navigateToWidget, selectedWidgets],
  );
}
