import React, { Component } from "react";
import type { ReactNode } from "react";
import { connect } from "react-redux";
import type { AppState } from "@appsmith/reducers";
import type { UIElementSize } from "components/editorComponents/ResizableUtils";
import WidgetNameComponent from "components/editorComponents/WidgetNameComponent";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import type { ExecuteTriggerPayload } from "constants/AppsmithActionConstants/ActionConstants";
import { MAX_MODAL_WIDTH_FROM_MAIN_WIDTH } from "constants/WidgetConstants";
import { WIDGET_PADDING } from "constants/WidgetConstants";
import { SelectionRequestType } from "sagas/WidgetSelectUtils";
import {
  getCanvasWidth,
  getIsAutoLayout,
  snipingModeSelector,
} from "selectors/editorSelectors";
import { EVAL_ERROR_PATH } from "utils/DynamicBindingUtils";
import type { EvaluationError } from "utils/DynamicBindingUtils";
import { generateClassName } from "utils/generators";
import { ClickContentToOpenPropPane } from "utils/hooks/useClickToSelectWidget";
import WidgetFactory from "WidgetProvider/factory";
import type { WidgetProps, WidgetState } from "widgets/BaseWidget";
import { isAutoHeightEnabledForWidget } from "widgets/WidgetUtils";
import ModalComponent from "../component";
import type { ModalWidgetProps } from ".";
import { get } from "lodash";

const minSize = 100;
class Modal extends Component<ConnectedModalWidgetProps, WidgetState> {
  getMaxModalWidth() {
    return this.props.mainCanvasWidth * MAX_MODAL_WIDTH_FROM_MAIN_WIDTH;
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
      this.props.executeAction({
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
    this.props.updateWidget("MODAL_RESIZE", this.props.widgetId, {
      ...newDimensions,
      canvasWidgetId,
    });
  };

  closeModal = (e: any) => {
    this.props.updateWidgetMetaProperty("isVisible", false);
    this.props.selectWidgetRequest(SelectionRequestType.Empty);
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
        errorCount={this.props.getErrorCount(
          get(this.props, EVAL_ERROR_PATH, {}),
        )}
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

  render() {
    let children = this.getChildren();

    if (this.props.editMode) {
      children = this.makeModalSelectable(children);
    }

    return this.makeModalComponent(children, this.props.editMode);
  }
}

const mapStateToProps = (state: AppState): StateProps => {
  const props = {
    mainCanvasWidth: getCanvasWidth(state),
    isSnipingMode: snipingModeSelector(state), // view
    isPreviewMode: state.ui.editor.isPreviewMode, // view
    isAutoLayout: getIsAutoLayout(state), // view
  };
  return props;
};

export default connect<StateProps, null, ConnectedModalWidgetProps>(
  mapStateToProps,
  null,
)(Modal);

interface ConnectedModalWidgetProps extends ModalWidgetProps {
  editMode: boolean;
  getErrorCount: (errors: Record<string, EvaluationError[]>) => number;
  selectWidgetRequest: (
    selectionRequestType: SelectionRequestType,
    payload?: string[],
  ) => void;
  updateWidget: (
    operationName: string,
    widgetId: string,
    widgetProperties: any,
  ) => void;
  executeAction(actionPayload: ExecuteTriggerPayload): void;
}

interface StateProps {
  mainCanvasWidth: number;
  isSnipingMode: boolean;
  isPreviewMode: boolean;
  isAutoLayout: boolean;
}
