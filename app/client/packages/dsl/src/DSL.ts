import type { RefObject } from "react";
import { schema, normalize, denormalize } from "normalizr";

export type WidgetType = string;

export type RenderMode =
  | "COMPONENT_PANE"
  | "CANVAS"
  | "PAGE"
  | "CANVAS_SELECTED";

export type WidgetStaticKeys =
  | "leftColumn"
  | "rightColumn"
  | "topRow"
  | "bottomRow"
  | "mobileTopRow"
  | "mobileBottomRow"
  | "mobileLeftColumn"
  | "mobileRightColumn"
  | "minHeight"
  | "parentColumnSpace"
  | "parentRowSpace"
  | "type"
  | "widgetId"
  | "widgetName"
  | "parentId"
  | "renderMode"
  | "detachFromLayout"
  | "noContainerOffset"
  | "height";

export enum Positioning {
  Fixed = "fixed",
  Horizontal = "horizontal",
  Vertical = "vertical",
}

export enum LayoutDirection {
  Horizontal = "Horizontal",
  Vertical = "Vertical",
}

export enum FlexVerticalAlignment {
  Top = "start",
  Center = "center",
  Bottom = "end",
}

export enum ResponsiveBehavior {
  Fill = "fill",
  Hug = "hug",
}

export enum AppPositioningTypes {
  FIXED = "FIXED",
  AUTO = "AUTO",
}

export interface WidgetEntity extends WidgetProps {
  meta: Record<string, unknown>;
  ENTITY_TYPE: "WIDGET";
}

interface LayoutProps {
  positioning?: Positioning;
  useAutoLayout?: boolean;
  direction?: LayoutDirection;
  isFlexChild?: boolean;
  responsiveBehavior?: ResponsiveBehavior;
}

export type CanvasWidgetStructure = Pick<WidgetProps, WidgetStaticKeys> &
  LayoutProps & {
    children?: CanvasWidgetStructure[];
    selected?: boolean;
    onClickCapture?: (event: React.MouseEvent<HTMLElement>) => void;
    isListWidgetCanvas?: boolean;
  };

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
  widthInPercentage?: number; // Stores the widget's width set by the user
  mobileWidthInPercentage?: number;
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
}

export interface IWidgetDataProps
  extends WidgetBaseProps,
    WidgetPositionProps,
    WidgetDisplayProps {}

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
    errors: Record<string, Error[]>;
    evaluatedValues?: Record<string, unknown>;
  };
}

export interface WidgetProps
  extends IWidgetDataProps,
    WidgetDynamicPathListProps,
    DataTreeEvaluationProps {
  key?: string;
  isDefaultClickDisabled?: boolean;

  [key: string]: any;
}

export interface FlattenedWidgetProps extends WidgetProps {
  children?: string[];
}

export interface DSLWidget extends WidgetProps {
  children?: DSLWidget[];
}

// actual code
class DSL {
  rawDSL: DSLWidget;
  widgetSchemaById: any;
  widgetSchemaByName: any;

  constructor(rawDSL: WidgetProps) {
    this.rawDSL = rawDSL;

    // schema by widgetId
    this.widgetSchemaById = new schema.Entity(
      "canvasWidgets",
      {},
      { idAttribute: "widgetId" },
    );
    this.widgetSchemaById.define({ children: [this.widgetSchemaById] });

    // schema by widgetName
    this.widgetSchemaByName = new schema.Entity(
      "canvasWidgets",
      {},
      { idAttribute: "widgetName" },
    );
    this.widgetSchemaByName.define({ children: [this.widgetSchemaByName] });
  }

  asNestedDSL() {
    return this.rawDSL;
  }

  asFlatDSL() {
    return normalize(this.rawDSL, this.widgetSchemaById);
  }

  asNestedDSLFromFlat(pageWidgetId: string, entities: any): DSLWidget {
    return denormalize(pageWidgetId, this.widgetSchemaById, entities);
  }

  asGitDSL() {
    return normalize(this.rawDSL, this.widgetSchemaByName);
  }

  asNestedDSLFromGit(pageWidgetId: string, entities: any): DSLWidget {
    return denormalize(pageWidgetId, this.widgetSchemaByName, entities);
  }
}

export default DSL;
