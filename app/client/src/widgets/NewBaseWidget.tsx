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
import { createSelector } from "reselect";

type ComponentProps = {
  widgetId: string;
};

type ReduxProps = {
  widgetProps: any;
  widgetActionProps: any;
};

type Props = ComponentProps & ReduxProps;

type State = {
  meta: Record<string, any>;
  metaUpdateQueue: Array<{ propertyName: string; propertyValue: any }>;
};

class BaseWidget extends Component<Props, State> {
  builder: undefined | WidgetBuilder<WidgetProps, WidgetState>;
  constructor(props: Props) {
    super(props);
    this.state = {
      meta: WidgetFactory.getWidgetMetaPropertiesMap(props.widgetProps.type),
      metaUpdateQueue: [],
    };
    this.builder = WidgetFactory.getWidgetBuilder(this.props.widgetProps.type);
  }
  render() {
    if (!this.props.widgetProps) return null;
    const props = {
      ...this.props.widgetProps,
      ...this.props.widgetActionProps,
      ...this.state.meta,
      updateWidgetMetaProperty: this.updateWidgetMetaProperty,
    };
    const widget = this.builder ? this.builder.buildWidget(props) : null;
    const style = this.getPositionStyle();
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
                <ErrorBoundary isValid>{widget}</ErrorBoundary>
              </ResizableComponent>
            </DraggableComponent>
          )}
          {this.props.widgetProps.detachFromLayout && widget}
        </PositionedContainer>
      </React.Fragment>
    );
  }

  updateWidgetMetaProperty = (propertyName: string, propertyValue: any) => {
    this.setState({
      meta: {
        ...this.state.meta,
        [propertyName]: propertyValue,
      },
    });
    this.props.widgetActionProps.updateWidgetMetaProperty(
      this.props.widgetId,
      propertyName,
      propertyValue,
    );
  };

  getPositionStyle(): BaseStyle {
    const { componentHeight, componentWidth } = getWidgetDimensions(
      this.props.widgetProps,
    );
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
}

const getWidgetProps = (widgetId: string) =>
  createSelector(
    (state: AppState) => state.dataTree,
    dataTree => _.find(dataTree, { widgetId }),
  );

const mapStateToProps = (state: AppState, ownProps: ComponentProps) => ({
  widgetProps: getWidgetProps(ownProps.widgetId)(state),
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
