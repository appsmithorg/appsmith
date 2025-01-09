import React, {
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";
import * as Sentry from "@sentry/react";
import { useSelector } from "react-redux";
import { getSelectedWidgets } from "selectors/ui";
import WidgetPropertyPane from "pages/Editor/PropertyPane";
import CanvasPropertyPane from "pages/Editor/CanvasPropertyPane";
import MultiSelectPropertyPane from "pages/Editor/MultiSelectPropertyPane";
import { getIsDraggingOrResizing } from "selectors/widgetSelectors";
import { selectedWidgetsPresentInCanvas } from "selectors/propertyPaneSelectors";
import WalkthroughContext from "components/featureWalkthrough/walkthroughContext";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import { selectCombinedPreviewMode } from "selectors/gitModSelectors";

export const PROPERTY_PANE_ID = "t--property-pane-sidebar";

export const PropertyPaneSidebar = memo(() => {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const prevSelectedWidgetId = useRef<string | undefined>();
  const isPreviewMode = useSelector(selectCombinedPreviewMode);

  const selectedWidgetIds = useSelector(getSelectedWidgets);
  const isDraggingOrResizing = useSelector(getIsDraggingOrResizing);
  const { isOpened: isWalkthroughOpened, popFeature } =
    useContext(WalkthroughContext) || {};
  //while dragging or resizing and
  //the current selected WidgetId is not equal to previous widget id,
  //then don't render PropertyPane
  const shouldNotRenderPane =
    isPreviewMode ||
    (isDraggingOrResizing &&
      selectedWidgetIds[0] !== prevSelectedWidgetId.current) ||
    selectedWidgetIds[0] === MAIN_CONTAINER_WIDGET_ID;

  const selectedWidgetsLength = useSelector(
    (state) => selectedWidgetsPresentInCanvas(state).length,
  );

  prevSelectedWidgetId.current =
    selectedWidgetIds.length === 1 ? selectedWidgetIds[0] : undefined;

  /**
   * renders the property pane:
   * 2. if no widget is selected -> CanvasPropertyPane
   * 3. if more than one widget is selected -> MultiWidgetPropertyPane
   * 4. if user is dragging for selection -> CanvasPropertyPane
   * 5. if only one widget is selected -> WidgetPropertyPane
   */
  const propertyPane = useMemo(() => {
    switch (true) {
      case selectedWidgetsLength > 1:
        return <MultiSelectPropertyPane />;
      case selectedWidgetsLength === 1:
        if (shouldNotRenderPane) return <CanvasPropertyPane />;
        else return <WidgetPropertyPane />;
      case selectedWidgetsLength === 0:
        return <CanvasPropertyPane />;
      default:
        return <CanvasPropertyPane />;
    }
  }, [selectedWidgetsLength, shouldNotRenderPane]);

  const closeWalkthrough = useCallback(() => {
    if (popFeature) {
      popFeature("PROPERTY_PANE");
      sidebarRef.current?.removeEventListener("click", closeWalkthrough);
    }
  }, [popFeature]);

  useEffect(() => {
    const currentSidebar = sidebarRef.current;

    if (isWalkthroughOpened) {
      currentSidebar?.addEventListener("click", closeWalkthrough);
    }

    return () => {
      currentSidebar?.removeEventListener("click", closeWalkthrough);
    };
  }, [closeWalkthrough, isWalkthroughOpened]);

  return (
    <div className="relative h-full">
      {/* PROPERTY PANE */}
      <div
        className="js-property-pane-sidebar t--property-pane-sidebar flex h-full border-l bg-white"
        data-testid={PROPERTY_PANE_ID}
        id={PROPERTY_PANE_ID}
        ref={sidebarRef}
      >
        <div className={"h-full p-0 overflow-y-auto min-w-72 max-w-104 w-full"}>
          {propertyPane}
        </div>
      </div>
    </div>
  );
});

PropertyPaneSidebar.displayName = "PropertyPaneSidebar";

export default Sentry.withProfiler(PropertyPaneSidebar);
