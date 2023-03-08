import React, { ReactNode } from "react";

import { connect } from "react-redux";

import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { AppState } from "@appsmith/reducers";
import { UIElementSize } from "components/editorComponents/ResizableUtils";
import WidgetNameComponent from "components/editorComponents/WidgetNameComponent";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { RenderMode, WIDGET_PADDING } from "constants/WidgetConstants";
import { ValidationTypes } from "constants/WidgetValidation";
import { Stylesheet } from "entities/AppTheming";
import { get } from "lodash";
import { SelectionRequestType } from "sagas/WidgetSelectUtils";
import { getCanvasWidth, snipingModeSelector } from "selectors/editorSelectors";
import { EVAL_ERROR_PATH } from "utils/DynamicBindingUtils";
import { generateClassName } from "utils/generators";
import { ClickContentToOpenPropPane } from "utils/hooks/useClickToSelectWidget";
import WidgetFactory from "utils/WidgetFactory";
import BaseWidget, { WidgetProps, WidgetState } from "widgets/BaseWidget";
import { isAutoHeightEnabledForWidget } from "widgets/WidgetUtils";
import ModalComponent from "../component";

const minSize = 100;

export class ModalWidget extends BaseWidget<ModalWidgetProps, WidgetState> {
  static getPropertyPaneContentConfig() {
    return [
      {
        sectionName: "General",
        children: [
          {
            helpText: "Enables scrolling for content inside the widget",
            propertyName: "shouldScrollContents",
            label: "Scroll Contents",
            controlType: "SWITCH",
            isBindProperty: false,
            isTriggerProperty: false,
          },
          {
            propertyName: "animateLoading",
            label: "Animate Loading",
            controlType: "SWITCH",
            helpText: "Controls the loading of the widget",
            defaultValue: true,
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
          {
            propertyName: "canOutsideClickClose",
            label: "Quick Dismiss",
            helpText: "Allows dismissing the modal when user taps outside",
            controlType: "SWITCH",
            isBindProperty: false,
            isTriggerProperty: false,
          },
        ],
      },
      {
        sectionName: "Events",
        children: [
          {
            helpText: "Triggers an action when the modal is closed",
            propertyName: "onClose",
            label: "onClose",
            controlType: "ACTION_SELECTOR",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: true,
          },
        ],
      },
    ];
  }

  static getPropertyPaneStyleConfig() {
    return [
      {
        sectionName: "Color",
        children: [
          {
            propertyName: "backgroundColor",
            helpText: "Sets the background color of the widget",
            label: "Background Color",
            controlType: "COLOR_PICKER",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
        ],
      },
      {
        sectionName: "Border and Shadow",
        children: [
          {
            propertyName: "borderRadius",
            label: "Border Radius",
            helpText:
              "Rounds the corners of the icon button's outer border edge",
            controlType: "BORDER_RADIUS_OPTIONS",

            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
        ],
      },
    ];
  }

  static getStylesheetConfig(): Stylesheet {
    return {
      borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
      boxShadow: "none",
    };
  }

  static defaultProps = {
    isOpen: true,
    canEscapeKeyClose: false,
  };

  getMaxModalWidth() {
    return this.props.mainCanvasWidth * 0.95;
  }

  getModalWidth(width: number) {
    return Math.min(this.getMaxModalWidth(), width);
  }

  renderChildWidget = (childWidgetData: WidgetProps): ReactNode => {
    const childData = { ...childWidgetData };
    childData.parentId = this.props.widgetId;

    childData.canExtend = this.props.shouldScrollContents;

    childData.containerStyle = "none";
    childData.minHeight = this.props.height;
    childData.rightColumn =
      this.getModalWidth(this.props.width) + WIDGET_PADDING * 2;

    return WidgetFactory.createWidget(childData, this.props.renderMode);
  };

  onModalClose = () => {
    if (this.props.onClose) {
      super.executeAction({
        triggerPropertyName: "onClose",
        dynamicString: this.props.onClose,
        event: {
          type: EventType.ON_MODAL_CLOSE,
        },
      });
    }
  };

  onModalResize = (dimensions: UIElementSize) => {
    const newDimensions = {
      height: Math.max(minSize, dimensions.height),
      width: Math.max(minSize, this.getModalWidth(dimensions.width)),
    };

    if (
      newDimensions.height !== this.props.height &&
      isAutoHeightEnabledForWidget(this.props)
    )
      return;

    const canvasWidgetId =
      this.props.children && this.props.children.length > 0
        ? this.props.children[0]?.widgetId
        : "";
    this.updateWidget("MODAL_RESIZE", this.props.widgetId, {
      ...newDimensions,
      canvasWidgetId,
    });
  };

  closeModal = (e: any) => {
    this.props.updateWidgetMetaProperty("isVisible", false);
    this.selectWidgetRequest(SelectionRequestType.Empty);
    // TODO(abhinav): Create a static property with is a map of widget properties
    // Populate the map on widget load
    e.stopPropagation();
    e.preventDefault();
  };

  getChildren(): ReactNode {
    if (
      this.props.height &&
      this.props.width &&
      this.props.children &&
      this.props.children.length > 0
    ) {
      const children = this.props.children.filter(Boolean);
      return children.length > 0 && children.map(this.renderChildWidget);
    }
  }

  makeModalSelectable(content: ReactNode): ReactNode {
    // substitute coz the widget lacks draggable and position containers.
    return (
      <ClickContentToOpenPropPane widgetId={this.props.widgetId}>
        {content}
      </ClickContentToOpenPropPane>
    );
  }

  makeModalComponent(content: ReactNode, isEditMode: boolean) {
    const artBoard = document.getElementById("art-board");
    const portalContainer = isEditMode && artBoard ? artBoard : undefined;
    const {
      focusedWidget,
      isDragging,
      isSnipingMode,
      selectedWidget,
      selectedWidgets,
      widgetId,
    } = this.props;

    const isWidgetFocused =
      focusedWidget === widgetId ||
      selectedWidget === widgetId ||
      selectedWidgets.includes(widgetId);

    const isResizeEnabled =
      !isDragging && isWidgetFocused && isEditMode && !isSnipingMode;

    const settingsComponent = isEditMode ? (
      <WidgetNameComponent
        errorCount={this.getErrorCount(get(this.props, EVAL_ERROR_PATH, {}))}
        parentId={this.props.parentId}
        showControls
        topRow={this.props.detachFromLayout ? 4 : this.props.topRow}
        type={this.props.type}
        widgetId={this.props.widgetId}
        widgetName={this.props.widgetName}
      />
    ) : null;

    return (
      <ModalComponent
        background={this.props.backgroundColor}
        borderRadius={this.props.borderRadius}
        canEscapeKeyClose={!!this.props.canEscapeKeyClose}
        canOutsideClickClose={!!this.props.canOutsideClickClose}
        className={`t--modal-widget ${generateClassName(this.props.widgetId)}`}
        enableResize={isResizeEnabled}
        height={this.props.height}
        isDynamicHeightEnabled={isAutoHeightEnabledForWidget(this.props)}
        isEditMode={isEditMode}
        isOpen={!!this.props.isVisible}
        maxWidth={this.getMaxModalWidth()}
        minSize={minSize}
        onClose={this.closeModal}
        onModalClose={this.onModalClose}
        portalContainer={portalContainer}
        resizeModal={this.onModalResize}
        scrollContents={!!this.props.shouldScrollContents}
        settingsComponent={settingsComponent}
        widgetId={this.props.widgetId}
        widgetName={this.props.widgetName}
        width={this.getModalWidth(this.props.width)}
      >
        {content}
      </ModalComponent>
    );
  }

  getCanvasView() {
    let children = this.getChildren();
    children = this.makeModalSelectable(children);
    return this.makeModalComponent(children, true);
  }

  getPageView() {
    const children = this.getChildren();
    return this.makeModalComponent(children, false);
  }

  static getWidgetType() {
    return "MODAL_WIDGET";
  }
}

export interface ModalWidgetProps extends WidgetProps {
  renderMode: RenderMode;
  isOpen?: boolean;
  children?: WidgetProps[];
  canOutsideClickClose?: boolean;
  width: number;
  height: number;
  showPropertyPane: (widgetId?: string) => void;
  deselectAllWidgets: () => void;
  canEscapeKeyClose?: boolean;
  shouldScrollContents?: boolean;
  size: string;
  onClose: string;
  mainContainer: WidgetProps;
  backgroundColor: string;
  borderRadius: string;
  mainCanvasWidth: number;
}

const mapDispatchToProps = (dispatch: any) => ({
  // TODO(abhinav): This is also available in dragResizeHooks
  // DRY this. Maybe leverage, CanvasWidget by making it a CanvasComponent?
  showPropertyPane: (
    widgetId?: string,
    callForDragOrResize?: boolean,
    force = false,
  ) => {
    dispatch({
      type:
        widgetId || callForDragOrResize
          ? ReduxActionTypes.SHOW_PROPERTY_PANE
          : ReduxActionTypes.HIDE_PROPERTY_PANE,
      payload: { widgetId, callForDragOrResize, force },
    });
  },
});

const mapStateToProps = (state: AppState) => {
  const props = {
    mainCanvasWidth: getCanvasWidth(state),
    isSnipingMode: snipingModeSelector(state),
    selectedWidget: state.ui.widgetDragResize.lastSelectedWidget,
    selectedWidgets: state.ui.widgetDragResize.selectedWidgets,
    focusedWidget: state.ui.widgetDragResize.focusedWidget,
    isDragging: state.ui.widgetDragResize.isDragging,
    isResizing: state.ui.widgetDragResize.isResizing,
  };
  return props;
};

export default connect(mapStateToProps, mapDispatchToProps)(ModalWidget);
