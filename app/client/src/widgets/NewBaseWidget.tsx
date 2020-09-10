import React, { Component } from "react";
import { connect } from "react-redux";
import { AppState } from "../reducers";
import { updateWidgetPropertyRequest } from "../actions/controlActions";
import {
  CONTAINER_GRID_PADDING,
  CSSUnits,
  PositionTypes,
  RenderModes,
} from "../constants/WidgetConstants";
import { ExecuteActionPayload } from "../constants/ActionConstants";
import { disableDragAction, executeAction } from "../actions/widgetActions";
import { BaseStyle, WidgetOperation } from "./BaseWidget";
import { updateWidget } from "../actions/pageActions";
import {
  resetChildrenMetaProperty,
  updateWidgetMetaProperty,
} from "../actions/metaActions";
import ErrorBoundary from "../components/editorComponents/ErrorBoundry";
import PositionedContainer from "../components/designSystems/appsmith/PositionedContainer";
import ResizableComponent from "../components/editorComponents/ResizableComponent";
import WidgetNameComponent from "../components/editorComponents/WidgetNameComponent";
import DraggableComponent from "../components/editorComponents/DraggableComponent";
import _ from "lodash";

type ComponentProps = {
  widgetId: string;
  builder: {
    buildWidget: (props: any) => React.ReactNode;
  };
};

type ReduxProps = {
  widgetProps: any;
  metaProps: Record<string, any> | undefined;
  widgetActionProps: any;
};

type Props = ComponentProps & ReduxProps;

class BaseWidget extends Component<Props, any> {
  render() {
    const props = {
      ...this.props.widgetProps,
      ...this.props.widgetActionProps,
      ...this.props.metaProps,
    };
    const style = this.getPositionStyle();
    return (
      <React.Fragment>
        <PositionedContainer
          widgetId={this.props.widgetProps.widgetId}
          widgetType={this.props.widgetProps.type}
          style={style}
        >
          <DraggableComponent {...this.props.widgetProps}>
            <WidgetNameComponent
              widgetName={this.props.widgetProps.widgetName}
              widgetId={this.props.widgetProps.widgetId}
              parentId={this.props.widgetProps.parentId}
              type={this.props.widgetProps.type}
              showControls={false}
            />
            <ResizableComponent
              {...this.props.widgetProps}
              paddingOffset={PositionedContainer.padding}
            >
              <ErrorBoundary isValid>
                {this.props.builder.buildWidget(props)}
              </ErrorBoundary>
            </ResizableComponent>
          </DraggableComponent>
        </PositionedContainer>
      </React.Fragment>
    );
  }
  private getPositionStyle(): BaseStyle {
    const { componentHeight, componentWidth } = this.getComponentDimensions();
    return {
      positionType: PositionTypes.ABSOLUTE,
      componentHeight,
      componentWidth,
      yPosition:
        this.props.widgetProps.topRow * this.props.widgetProps.parentRowSpace +
        CONTAINER_GRID_PADDING,
      xPosition:
        this.props.widgetProps.leftColumn *
          this.props.widgetProps.parentColumnSpace +
        CONTAINER_GRID_PADDING,
      xPositionUnit: CSSUnits.PIXEL,
      yPositionUnit: CSSUnits.PIXEL,
    };
  }
  getComponentDimensions = () => {
    return this.calculateWidgetBounds(
      this.props.widgetProps.rightColumn,
      this.props.widgetProps.leftColumn,
      this.props.widgetProps.topRow,
      this.props.widgetProps.bottomRow,
      this.props.widgetProps.parentColumnSpace,
      this.props.widgetProps.parentRowSpace,
    );
  };

  calculateWidgetBounds(
    rightColumn: number,
    leftColumn: number,
    topRow: number,
    bottomRow: number,
    parentColumnSpace: number,
    parentRowSpace: number,
  ): {
    componentWidth: number;
    componentHeight: number;
  } {
    return {
      componentWidth: (rightColumn - leftColumn) * parentColumnSpace,
      componentHeight: (bottomRow - topRow) * parentRowSpace,
    };
  }
}

const getWidgetProps = (state: AppState, widgetId: string) => {
  return _.find(state.dataTree, e => {
    if (_.isObject(e) && "widgetId" in e) {
      return e.widgetId === widgetId;
    }
    return false;
  });
};

const mapStateToProps = (state: AppState, ownProps: ComponentProps) => ({
  metaProps: state.entities.meta[ownProps.widgetId],
  widgetProps: getWidgetProps(state, ownProps.widgetId),
});

const mapDispatchToProps = (dispatch: any) => {
  return {
    widgetActionProps: {
      updateWidgetProperty: (
        widgetId: string,
        propertyName: string,
        propertyValue: any,
      ) =>
        dispatch(
          updateWidgetPropertyRequest(
            widgetId,
            propertyName,
            propertyValue,
            RenderModes.CANVAS,
          ),
        ),
      executeAction: (actionPayload: ExecuteActionPayload) =>
        dispatch(executeAction(actionPayload)),
      updateWidget: (
        operation: WidgetOperation,
        widgetId: string,
        payload: any,
      ) => dispatch(updateWidget(operation, widgetId, payload)),
      updateWidgetMetaProperty: (
        widgetId: string,
        propertyName: string,
        propertyValue: any,
      ) =>
        dispatch(
          updateWidgetMetaProperty(widgetId, propertyName, propertyValue),
        ),
      resetChildrenMetaProperty: (widgetId: string) =>
        dispatch(resetChildrenMetaProperty(widgetId)),
      disableDrag: (disable: boolean) => {
        dispatch(disableDragAction(disable));
      },
    },
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(BaseWidget);
