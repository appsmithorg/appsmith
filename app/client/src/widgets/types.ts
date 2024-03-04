import type { WidgetEntity } from "@appsmith/entities/DataTree/types";
import type {
  CanvasWidgetStructure,
  FlattenedWidgetProps,
} from "WidgetProvider/types";
import type {
  CSSUnit,
  PositionType,
  RenderMode,
  WidgetType,
} from "constants/WidgetConstants";
import type {
  FlexVerticalAlignment,
  LayoutDirection,
  ResponsiveBehavior,
} from "layoutSystems/common/utils/constants";
import type { LayoutSystemTypes } from "layoutSystems/types";
import type { RefObject } from "react";

export interface WidgetProps
  extends WidgetDataProps,
    WidgetDynamicPathListProps,
    DataTreeEvaluationProps {
  key?: string;
  isDefaultClickDisabled?: boolean;

  [key: string]: any;
}

export interface WidgetDataProps
  extends WidgetBaseProps,
    WidgetErrorProps,
    WidgetPositionProps,
    WidgetDisplayProps,
    WidgetCanvasProps {}

export interface WidgetError extends Error {
  type: "property" | "configuration" | "other";
  path?: string;
}

export interface WidgetErrorProps {
  errors?: WidgetError[];
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
  selectedWidgetAncestry?: string[];
  classList?: string[];
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
  layoutSystemType?: LayoutSystemTypes;
  widthInPercentage?: number; // Stores the widget's width set by the user
  mobileWidthInPercentage?: number;
  width?: number;
}

export interface WidgetCanvasProps {
  isWidgetSelected?: boolean;
}

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

export type WidgetState = Record<string, unknown>;

export interface WidgetBuilder<
  T extends CanvasWidgetStructure,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  S extends WidgetState,
> {
  buildWidget(widgetProps: T): JSX.Element;
}

export interface WidgetBaseProps {
  widgetId: string;
  metaWidgetId?: string;
  type: WidgetType;
  widgetName: string;
  parentId?: string;
  renderMode: RenderMode;
  version: number;
  childWidgets?: WidgetEntity[];
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
  mainCanvasWidth?: number;
  isMobile?: boolean;
  hasAutoHeight?: boolean;
  hasAutoWidth?: boolean;
  widgetSize?: { [key: string]: Record<string, string> };
}

export interface WidgetRowCols {
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
}

export const WidgetOperations = {
  MOVE: "MOVE",
  RESIZE: "RESIZE",
  ADD_CHILD: "ADD_CHILD",
  UPDATE_PROPERTY: "UPDATE_PROPERTY",
  DELETE: "DELETE",
  ADD_CHILDREN: "ADD_CHILDREN",
};

export type WidgetOperation =
  (typeof WidgetOperations)[keyof typeof WidgetOperations];

export const WIDGET_DISPLAY_PROPS = {
  isVisible: true,
  isLoading: true,
  isDisabled: true,
  backgroundColor: true,
};

export interface DynamicPath {
  key: string;
  value?: string;
}

export interface WidgetDynamicPathListProps {
  dynamicBindingPathList?: DynamicPath[];
  dynamicTriggerPathList?: DynamicPath[];
  dynamicPropertyPathList?: DynamicPath[];
}

export interface DataTreeEvaluationProps {
  __evaluation__?: {
    errors: Record<string, EvaluationError[]>;
    evaluatedValues?: Record<string, unknown>;
  };
}

export enum PropertyEvaluationErrorType {
  VALIDATION = "VALIDATION",
  PARSE = "PARSE",
  LINT = "LINT",
}

export enum PropertyEvaluationErrorCategory {
  ACTION_INVOCATION_IN_DATA_FIELD = "ACTION_INVOCATION_IN_DATA_FIELD",
}
export interface PropertyEvaluationErrorKind {
  category: PropertyEvaluationErrorCategory;
  rootcause: string;
}

export interface DataTreeError {
  raw: string;
  errorMessage: Error;
  severity: Severity.WARNING | Severity.ERROR;
}

export interface EvaluationError extends DataTreeError {
  errorType:
    | PropertyEvaluationErrorType.PARSE
    | PropertyEvaluationErrorType.VALIDATION;
  originalBinding?: string;
  kind?: Partial<PropertyEvaluationErrorKind>;
}

export interface LintError extends DataTreeError {
  errorType: PropertyEvaluationErrorType.LINT;
  errorSegment: string;
  originalBinding: string;
  variables: (string | undefined | null)[];
  code: string;
  line: number;
  ch: number;
  originalPath?: string;
}

export enum Severity {
  // Everything, irrespective of what the user should see or not
  // DEBUG = "debug",
  // Something the dev user should probably know about
  INFO = "info",
  // Doesn't break the app, but can cause slowdowns / ux issues/ unexpected behaviour
  WARNING = "warning",
  // Can cause an error in some cases/ single widget, app will work in other cases
  ERROR = "error",
  // Makes the app unusable, can't progress without fixing this.
  // CRITICAL = "critical",
}

export type LintErrorsStore = Record<string, LintError[]>;
