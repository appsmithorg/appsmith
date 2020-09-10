import React, { Component } from "react";
import { connect } from "react-redux";
import { AppState } from "../reducers";
import { updateWidgetPropertyRequest } from "../actions/controlActions";
import {
  CONTAINER_GRID_PADDING,
  CSSUnits,
  PositionTypes,
  RenderModes,
  WidgetType,
  PositionType,
  CSSUnit,
} from "../constants/WidgetConstants";
import { ExecuteActionPayload } from "../constants/ActionConstants";
import { disableDragAction, executeAction } from "../actions/widgetActions";
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
import { getWidgetDimensions } from "./helpers";
import WidgetFactory from "utils/WidgetFactory";

type ComponentProps = {
  widgetId: string;
};

type ReduxProps = {
  widgetProps: any;
  metaProps: Record<string, any> | undefined;
  widgetActionProps: any;
};

type Props = ComponentProps & ReduxProps;

class BaseWidget extends Component<Props, any> {
  constructor(props: Props) {
    super(props);
  }
  render() {
    if (!this.props.widgetProps) return null;
    const builder = WidgetFactory.getWidgetBuilder(this.props.widgetProps.type);
    const props = {
      ...this.props.widgetProps,
      ...this.props.widgetActionProps,
      ...this.props.metaProps,
    };
    const style = this.getPositionStyle();
    const widget = (
      <ErrorBoundary isValid>{builder.buildWidget(props)}</ErrorBoundary>
    );
    return (
      <React.Fragment>
        <PositionedContainer
          widgetId={this.props.widgetProps.widgetId}
          widgetType={this.props.widgetProps.type}
          style={style}
        >
          {!this.props.widgetProps.detachFromLayout && (
            <DraggableComponent {...this.props.widgetProps}>
              <WidgetNameComponent
                widgetName={this.props.widgetProps.widgetName}
                widgetId={this.props.widgetProps.widgetId}
                parentId={this.props.widgetProps.parentId}
                type={this.props.widgetProps.type}
                showControls={this.props.widgetProps.detachFromLayout === true}
              />

              <ResizableComponent
                {...this.props.widgetProps}
                paddingOffset={PositionedContainer.padding}
              >
                {widget}
              </ResizableComponent>
            </DraggableComponent>
          )}
          {this.props.widgetProps.detachFromLayout && widget}
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
    return getWidgetDimensions(this.props.widgetProps);
  };
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

export interface BaseStyle {
  componentHeight: number;
  componentWidth: number;
  positionType: PositionType;
  xPosition: number;
  yPosition: number;
  xPositionUnit: CSSUnit;
  yPositionUnit: CSSUnit;
  heightUnit?: CSSUnit;
  widthUnit?: CSSUnit;
}

export type WidgetState = {};

export interface WidgetBuilder<T extends WidgetProps, S extends WidgetState> {
  buildWidget(widgetProps: T): JSX.Element;
}

export interface WidgetBaseProps {
  widgetId: string;
  type: WidgetType;
  widgetName: string;
  parentId: string;
}

export type WidgetRowCols = {
  leftColumn: number;
  rightColumn: number;
  topRow: number;
  bottomRow: number;
  minHeight?: number; // Required to reduce the size of CanvasWidgets.
};

export interface WidgetPositionProps extends WidgetRowCols {
  parentColumnSpace: number;
  parentRowSpace: number;
  // The detachFromLayout flag tells use about the following properties when enabled
  // 1) Widget does not drag/resize
  // 2) Widget CAN (but not neccessarily) be a dropTarget
  // Examples: MainContainer is detached from layout,
  // MODAL_WIDGET is also detached from layout.
  detachFromLayout?: boolean;
}

export interface WidgetDisplayProps {
  //TODO(abhinav): Some of these props are mandatory
  isVisible?: boolean;
  isLoading: boolean;
  isDisabled?: boolean;
  backgroundColor?: string;
}

export interface WidgetDataProps
  extends WidgetBaseProps,
    WidgetPositionProps,
    WidgetDisplayProps {}

export interface WidgetProps extends WidgetDataProps {
  key?: string;
  dynamicBindings?: Record<string, true>;
  dynamicTriggers?: Record<string, true>;
  dynamicProperties?: Record<string, true>;
  invalidProps?: Record<string, boolean>;
  validationMessages?: Record<string, string>;
  evaluatedValues?: Record<string, any>;
  isDefaultClickDisabled?: boolean;
  [key: string]: any;
}

export interface WidgetCardProps {
  type: WidgetType;
  key?: string;
  widgetCardName: string;
}

export const WidgetOperations = {
  MOVE: "MOVE",
  RESIZE: "RESIZE",
  ADD_CHILD: "ADD_CHILD",
  REMOVE_CHILD: "REMOVE_CHILD",
  UPDATE_PROPERTY: "UPDATE_PROPERTY",
  DELETE: "DELETE",
};

export type WidgetOperation = typeof WidgetOperations[keyof typeof WidgetOperations];

export default connect(mapStateToProps, mapDispatchToProps)(BaseWidget);
