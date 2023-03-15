
import {RenderMode, WidgetType} from "../../../client/src/constants/WidgetConstants";
import {DataTreeWidget} from "../../../client/src/entities/DataTree/dataTreeFactory";
import {CanvasWidgetStructure, FlattenedWidgetProps} from "../../../client/src/widgets/constants";
import {
    FlexVerticalAlignment,
    LayoutDirection,
    ResponsiveBehavior
} from "../../../client/src/utils/autoLayout/constants";
import {AppPositioningTypes} from "../../../client/src/reducers/entityReducers/pageListReducer";

export interface DSLWidget extends WidgetProps {
    children?: DSLWidget[];
}

export interface WidgetDataProps
    extends WidgetBaseProps,
        WidgetPositionProps,
        WidgetDisplayProps {}


export interface WidgetProps
    extends WidgetDataProps,
        WidgetDynamicPathListProps,
        DataTreeEvaluationProps {
    key?: string;
    isDefaultClickDisabled?: boolean;

    [key: string]: any;
}

export interface WidgetDynamicPathListProps {
    dynamicBindingPathList?: DynamicPath[];
    dynamicTriggerPathList?: DynamicPath[];
    dynamicPropertyPathList?: DynamicPath[];
}

export interface DynamicPath {
    key: string;
    value?: string;
}

export interface WidgetBaseProps {
    widgetId: string;
    metaWidgetId?: string;
    type: WidgetType;
    widgetName: string;
    parentId?: string;
    renderMode: RenderMode;
    version: number;
    childWidgets?: DataTreeWidget[];
    flattenedChildCanvasWidgets?: Record<string, FlattenedWidgetProps>;
    metaWidgetChildrenStructure?: CanvasWidgetStructure[];
    referencedWidgetId?: string;
    requiresFlatWidgetChildren?: boolean;
    hasMetaWidgets?: boolean;
    creatorId?: string;
    isMetaWidget?: boolean;
    suppressAutoComplete?: boolean;
    suppressDebuggerError?: boolean;
    disallowCopy?: boolean;
    /**
     * The keys of the props mentioned here would always be picked from the canvas widget
     * rather than the evaluated values in withWidgetProps HOC.
     *  */
    additionalStaticProps?: string[];
}

export interface WidgetDisplayProps {
    //TODO(abhinav): Some of these props are mandatory
    isVisible?: boolean;
    isLoading: boolean;
    isDisabled?: boolean;
    backgroundColor?: string;
    animateLoading?: boolean;
    deferRender?: boolean;
    wrapperRef?: RefObject<HTMLDivElement>;
}

export interface WidgetPositionProps extends WidgetRowCols {
    parentColumnSpace: number;
    parentRowSpace: number;
    // The detachFromLayout flag tells use about the following properties when enabled
    // 1) Widget does not drag/resize
    // 2) Widget CAN (but not neccessarily) be a dropTarget
    // Examples: MainContainer is detached from layout,
    // MODAL_WIDGET is also detached from layout.
    detachFromLayout?: boolean;
    noContainerOffset?: boolean; // This won't offset the child in parent
    isFlexChild?: boolean;
    direction?: LayoutDirection;
    responsiveBehavior?: ResponsiveBehavior;
    minWidth?: number; // Required to avoid squishing of widgets on mobile viewport.
    isMobile?: boolean;
    flexVerticalAlignment?: FlexVerticalAlignment;
    appPositioningType?: AppPositioningTypes;
}

export type WidgetRowCols = {
    leftColumn: number;
    rightColumn: number;
    topRow: number;
    bottomRow: number;
    minHeight?: number; // Required to reduce the size of CanvasWidgets.
    mobileLeftColumn?: number;
    mobileRightColumn?: number;
    mobileTopRow?: number;
    mobileBottomRow?: number;
    height?: number;
};

export type RenderMode =
    | "COMPONENT_PANE"
    | "CANVAS"
    | "PAGE"
    | "CANVAS_SELECTED";