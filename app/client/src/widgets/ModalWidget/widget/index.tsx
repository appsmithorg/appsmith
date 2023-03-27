import type { ReactNode } from "react";
import React from "react";

import { connect } from "react-redux";

import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import type { AppState } from "@appsmith/reducers";
import type { UIElementSize } from "components/editorComponents/ResizableUtils";
import WidgetNameComponent from "components/editorComponents/WidgetNameComponent";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import type { RenderMode } from "constants/WidgetConstants";
import { WIDGET_PADDING } from "constants/WidgetConstants";
import { ValidationTypes } from "constants/WidgetValidation";
import type { Stylesheet } from "entities/AppTheming";
import { get } from "lodash";
import { SelectionRequestType } from "sagas/WidgetSelectUtils";
import {
  getCanvasWidth,
  getIsAutoLayout,
  snipingModeSelector,
} from "selectors/editorSelectors";
import type {
  Alignment,
  Positioning,
  Spacing,
} from "utils/autoLayout/constants";
import { EVAL_ERROR_PATH } from "utils/DynamicBindingUtils";
import { generateClassName } from "utils/generators";
import { ClickContentToOpenPropPane } from "utils/hooks/useClickToSelectWidget";
import WidgetFactory from "utils/WidgetFactory";
import type { WidgetProps, WidgetState } from "widgets/BaseWidget";
import BaseWidget from "widgets/BaseWidget";
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
          // { ...generatePositioningConfig(Positioning.Fixed) },
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

  getModalVisibility() {
    if (this.props.selectedWidgetAncestry) {
      return (
        this.props.selectedWidgetAncestry.includes(this.props.widgetId) ||
        !!this.props.isVisible
      );
    }
    return !!this.props.isVisible;
  }

  renderChildWidget = (childWidgetData: WidgetProps): ReactNode => {
    const childData = { ...childWidgetData };
    childData.parentId = this.props.widgetId;

    childData.canExtend = this.props.shouldScrollContents;

    childData.containerStyle = "none";
    childData.minHeight = this.props.height;
    childData.rightColumn =
      this.getModalWidth(this.props.width) + WIDGET_PADDING * 2;

    childData.positioning = this.props.positioning;
    childData.alignment = this.props.alignment;
    childData.spacing = this.props.spacing;
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
    const { isPreviewMode, isSnipingMode } = this.props;
    const modalWidth = this.getModalWidth(this.props.width);
    const isResizeEnabled = isEditMode && !isSnipingMode && !isPreviewMode;
    const settingsComponent = isEditMode ? (
      <WidgetNameComponent
        errorCount={this.getErrorCount(get(this.props, EVAL_ERROR_PATH, {}))}
        parentId={this.props.parentId}
        showControls
        topRow={this.props.detachFromLayout ? 4 : this.props.topRow}
        type={this.props.type}
        widgetId={this.props.widgetId}
        widgetName={this.props.widgetName}
        widgetWidth={modalWidth}
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
        isAutoLayout={this.props.isAutoLayout}
        isDynamicHeightEnabled={isAutoHeightEnabledForWidget(this.props)}
        isEditMode={isEditMode}
        isOpen={this.getModalVisibility()}
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
        width={modalWidth}
      >
        {content}
      </ModalComponent>
    );
  }

  getCanvasView() {
    let children = this.getChildren();
    children = this.makeModalSelectable(children);
    // children = this.showWidgetName(children, true);

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
  positioning?: Positioning;
  alignment: Alignment;
  spacing: Spacing;
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
    isResizing: state.ui.widgetDragResize.isResizing,
    isPreviewMode: state.ui.editor.isPreviewMode,
    isAutoLayout: getIsAutoLayout(state),
  };
  return props;
};

export default connect(mapStateToProps, mapDispatchToProps)(ModalWidget);
