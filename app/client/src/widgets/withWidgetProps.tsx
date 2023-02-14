import equal from "fast-deep-equal/es6";
import React from "react";

import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { AppState } from "@appsmith/reducers";
import { checkContainersForAutoHeightAction } from "actions/autoHeightActions";
import {
  GridDefaults,
  MAIN_CONTAINER_WIDGET_ID,
  RenderModes,
} from "constants/WidgetConstants";
import { useDispatch, useSelector } from "react-redux";
import { getWidget } from "sagas/selectors";
import {
  getIsWidgetLoading,
  getWidgetEvalValues,
} from "selectors/dataTreeSelectors";
import {
  computeMainContainerWidget,
  getChildWidgets,
  getCurrentAppPositioningType,
  getMainCanvasProps,
  getRenderMode,
  previewModeSelector,
} from "selectors/editorSelectors";
import { getIsMobile } from "selectors/mainCanvasSelectors";
import {
  createCanvasWidget,
  createLoadingWidget,
} from "utils/widgetRenderUtils";
import BaseWidget, { WidgetProps } from "./BaseWidget";
import { AppPositioningTypes } from "reducers/entityReducers/pageListReducer";
import {
  defaultAutoLayoutWidgets,
  Positioning,
} from "utils/autoLayout/constants";
import { isAutoHeightEnabledForWidget } from "./WidgetUtils";
import { CANVAS_DEFAULT_MIN_HEIGHT_PX } from "constants/AppConstants";
import { getGoogleMapsApiKey } from "ce/selectors/tenantSelectors";

const WIDGETS_WITH_CHILD_WIDGETS = ["LIST_WIDGET", "FORM_WIDGET"];

function withWidgetProps(WrappedWidget: typeof BaseWidget) {
  function WrappedPropsComponent(
    props: WidgetProps & { skipWidgetPropsHydration?: boolean },
  ) {
    const { children, skipWidgetPropsHydration, type, widgetId } = props;
    const isPreviewMode = useSelector(previewModeSelector);
    const canvasWidget = useSelector((state: AppState) =>
      getWidget(state, widgetId),
    );
    const mainCanvasProps = useSelector((state: AppState) =>
      getMainCanvasProps(state),
    );
    const googleMapsApiKey = useSelector(getGoogleMapsApiKey);
    const renderMode = useSelector(getRenderMode);
    const evaluatedWidget = useSelector((state: AppState) =>
      getWidgetEvalValues(state, canvasWidget?.widgetName),
    );
    const isLoading = useSelector((state: AppState) =>
      getIsWidgetLoading(state, canvasWidget?.widgetName),
    );
    const isMobile = useSelector(getIsMobile);
    const appPositioningType = useSelector(getCurrentAppPositioningType);

    const dispatch = useDispatch();

    const childWidgets = useSelector((state: AppState) => {
      if (!WIDGETS_WITH_CHILD_WIDGETS.includes(type)) return undefined;
      return getChildWidgets(state, widgetId);
    }, equal);

    let widgetProps: WidgetProps = {} as WidgetProps;
    if (!skipWidgetPropsHydration) {
      const canvasWidgetProps = (() => {
        if (widgetId === MAIN_CONTAINER_WIDGET_ID) {
          const computed = computeMainContainerWidget(
            canvasWidget,
            mainCanvasProps,
          );
          if (renderMode === RenderModes.CANVAS) {
            return {
              ...computed,
              bottomRow: Math.max(
                computed.minHeight,
                computed.bottomRow +
                  GridDefaults.MAIN_CANVAS_EXTENSION_OFFSET *
                    GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
              ),
            };
          } else {
            return {
              ...computed,
              bottomRow: Math.max(
                CANVAS_DEFAULT_MIN_HEIGHT_PX,
                computed.bottomRow +
                  GridDefaults.VIEW_MODE_MAIN_CANVAS_EXTENSION_OFFSET *
                    GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
              ),
            };
          }
        }

        return evaluatedWidget
          ? createCanvasWidget(canvasWidget, evaluatedWidget)
          : createLoadingWidget(canvasWidget);
      })();

      widgetProps = { ...canvasWidgetProps };

      widgetProps.isMobile = !!isMobile;
      widgetProps.appPositioningType = appPositioningType;

      /**
       * MODAL_WIDGET by default is to be hidden unless the isVisible property is found.
       * If the isVisible property is undefined and the widget is MODAL_WIDGET then isVisible
       * is set to false
       * If the isVisible property is undefined and the widget is not MODAL_WIDGET then isVisible
       * is set to true
       */
      widgetProps.isVisible =
        canvasWidgetProps.isVisible ??
        canvasWidgetProps.type !== "MODAL_WIDGET";

      if (
        props.type === "CANVAS_WIDGET" &&
        widgetId !== MAIN_CONTAINER_WIDGET_ID
      ) {
        const isListWidgetCanvas =
          props.noPad && props.dropDisabled && props.openParentPropertyPane;

        widgetProps.rightColumn = props.rightColumn;
        if (isListWidgetCanvas) {
          widgetProps.bottomRow = props.bottomRow;
          widgetProps.minHeight = props.minHeight;
        }

        widgetProps.shouldScrollContents = props.shouldScrollContents;
        widgetProps.canExtend = props.canExtend;
        widgetProps.parentId = props.parentId;
      } else if (widgetId !== MAIN_CONTAINER_WIDGET_ID) {
        widgetProps.parentColumnSpace = props.parentColumnSpace;
        widgetProps.parentRowSpace = props.parentRowSpace;
        widgetProps.parentId = props.parentId;
        // Form Widget Props
        widgetProps.onReset = props.onReset;
        if ("isFormValid" in props) widgetProps.isFormValid = props.isFormValid;
      }

      if (defaultAutoLayoutWidgets.includes(props.type)) {
        widgetProps.positioning =
          appPositioningType && appPositioningType === AppPositioningTypes.AUTO
            ? Positioning.Vertical
            : Positioning.Fixed;
      }

      widgetProps.children = children;

      widgetProps.isLoading = isLoading;
      widgetProps.childWidgets = childWidgets;
    }
    //merging with original props
    widgetProps = { ...props, ...widgetProps, renderMode };

    // adding google maps api key to widget props (although meant for map widget only)
    widgetProps.googleMapsApiKey = googleMapsApiKey;

    // isVisible prop defines whether to render a detached widget
    if (widgetProps.detachFromLayout && !widgetProps.isVisible) {
      return null;
    }

    const shouldCollapseWidgetInViewOrPreviewMode =
      !widgetProps.isVisible &&
      (renderMode === RenderModes.PAGE || isPreviewMode);

    const shouldResetCollapsedContainerHeightInViewOrPreviewMode =
      widgetProps.isVisible && widgetProps.topRow === widgetProps.bottomRow;

    const shouldResetCollapsedContainerHeightInCanvasMode =
      widgetProps.topRow === widgetProps.bottomRow &&
      renderMode === RenderModes.CANVAS &&
      !isPreviewMode;

    // We don't render invisible widgets in view mode
    if (shouldCollapseWidgetInViewOrPreviewMode) {
      if (widgetProps.bottomRow !== widgetProps.topRow) {
        dispatch({
          type: ReduxActionTypes.UPDATE_WIDGET_AUTO_HEIGHT,
          payload: {
            widgetId: props.widgetId,
            height: 0,
          },
        });
      }
      return null;
    } else if (
      shouldResetCollapsedContainerHeightInViewOrPreviewMode ||
      shouldResetCollapsedContainerHeightInCanvasMode
    ) {
      // We also need to check if a non-auto height widget has collapsed earlier
      // We can figure this out if the widget height is zero and the beforeCollapse
      // topRow and bottomRow are available.

      // If the above is true, we call an auto height update call
      // so that the widget can be reset correctly.
      if (
        widgetProps.topRow === widgetProps.bottomRow &&
        widgetProps.topRowBeforeCollapse !== undefined &&
        widgetProps.bottomRowBeforeCollapse !== undefined &&
        !isAutoHeightEnabledForWidget(widgetProps)
      ) {
        const heightBeforeCollapse =
          (widgetProps.bottomRowBeforeCollapse -
            widgetProps.topRowBeforeCollapse) *
          GridDefaults.DEFAULT_GRID_ROW_HEIGHT;
        dispatch({
          type: ReduxActionTypes.UPDATE_WIDGET_AUTO_HEIGHT,
          payload: {
            widgetId: props.widgetId,
            height: heightBeforeCollapse,
          },
        });
      } else {
        dispatch(checkContainersForAutoHeightAction());
      }
    }

    return <WrappedWidget {...widgetProps} />;
  }

  return WrappedPropsComponent;
}

export default withWidgetProps;
