/**
 * Widget are responsible for accepting the abstraction layer inputs, interpretting them into rederable props and
 * spawing components based on those props
 * Widgets are also responsible for dispatching actions and updating the state tree
 */
import type { BatchPropertyUpdatePayload } from "actions/controlActions";
import type { EditorContextType } from "components/editorComponents/EditorContextProvider";
import { EditorContext } from "components/editorComponents/EditorContextProvider";
import type { ExecuteTriggerPayload } from "constants/AppsmithActionConstants/ActionConstants";
import type { PropertyPaneConfig } from "constants/PropertyControlConstants";
import type {
  CSSUnit,
  PositionType,
  RenderMode,
  WidgetTags,
  WidgetType,
} from "constants/WidgetConstants";
import { RenderModes } from "constants/WidgetConstants";
import { ENTITY_TYPE } from "ee/entities/AppsmithConsole/utils";
import type { SetterConfig, Stylesheet } from "entities/AppTheming";
import type { Context, ReactNode, RefObject } from "react";
import { Component } from "react";
import type {
  ModifyMetaWidgetPayload,
  UpdateMetaWidgetPropertyPayload,
} from "reducers/entityReducers/metaWidgetsReducer";
import { SelectionRequestType } from "sagas/WidgetSelectUtils";
import shallowequal from "shallowequal";
import AppsmithConsole from "utils/AppsmithConsole";
import type {
  DataTreeEvaluationProps,
  WidgetDynamicPathListProps,
} from "utils/DynamicBindingUtils";
import type { DerivedPropertiesMap } from "WidgetProvider/factory";
import type {
  AnvilConfig,
  AutoLayoutConfig,
  CanvasWidgetStructure,
  FlattenedWidgetProps,
  WidgetBaseConfiguration,
  WidgetDefaultProps,
  WidgetMethods,
} from "../WidgetProvider/constants";
import type { WidgetEntity } from "ee/entities/DataTree/types";
import type { AutocompletionDefinitions } from "../WidgetProvider/constants";
import type {
  FlexVerticalAlignment,
  LayoutDirection,
  ResponsiveBehavior,
} from "layoutSystems/common/utils/constants";
import type { FeatureFlag } from "ee/entities/FeatureFlag";
import store from "store";
import { selectFeatureFlags } from "ee/selectors/featureFlagsSelectors";
import type { WidgetFeatures } from "utils/WidgetFeatures";
import { LayoutSystemTypes } from "layoutSystems/types";
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import type {
  CopiedWidgetData,
  PasteDestinationInfo,
  PastePayload,
} from "layoutSystems/anvil/utils/paste/types";
import { type CallEffect, call } from "redux-saga/effects";

/***
 * BaseWidget
 *
 * The abstract class which is extended/implemented by all widgets.
 * Widgets must adhere to the abstractions provided by BaseWidget.
 *
 * Do not:
 * 1) Use the context directly in the widgets
 * 2) Update or access the dsl in the widgets
 * 3) Call actions in widgets or connect the widgets to the entity reducers
 *
 */

const REFERENCE_KEY = "$$refs$$";

abstract class BaseWidget<
  T extends WidgetProps,
  K extends WidgetState,
  TCache = unknown,
> extends Component<T, K> {
  static contextType = EditorContext;

  context!: React.ContextType<Context<EditorContextType<TCache>>>;

  static type = "BASE_WIDGET";

  static getDefaults(): WidgetDefaultProps {
    return {} as WidgetDefaultProps;
  }

  static getConfig(): WidgetBaseConfiguration {
    return {
      name: "baseWidget",
    };
  }

  static getFeatures(): WidgetFeatures | null {
    return null;
  }

  static getMethods(): WidgetMethods {
    return {};
  }

  static getAutoLayoutConfig(): AutoLayoutConfig | null {
    return null;
  }

  static getAnvilConfig(): AnvilConfig | null {
    return null;
  }

  static getSetterConfig(): SetterConfig | null {
    return null;
  }

  static getPropertyPaneConfig(): PropertyPaneConfig[] {
    return [];
  }

  static getPropertyPaneContentConfig(): PropertyPaneConfig[] {
    return [];
  }

  static getPropertyPaneStyleConfig(): PropertyPaneConfig[] {
    return [];
  }

  static getDerivedPropertiesMap(): DerivedPropertiesMap {
    return {};
  }

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static getDefaultPropertiesMap(): Record<string, any> {
    return {};
  }

  static getDependencyMap(): Record<string, string[]> {
    return {};
  }

  // TODO Find a way to enforce this, (dont let it be set)
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static getMetaPropertiesMap(): Record<string, any> {
    return {};
  }

  static getStylesheetConfig(): Stylesheet {
    return {};
  }

  static getAutocompleteDefinitions(): AutocompletionDefinitions {
    return {};
  }

  /* eslint-disable @typescript-eslint/no-unused-vars */
  static pasteOperationChecks(
    allWidgets: CanvasWidgetsReduxState, // All widgets
    oldWidget: FlattenedWidgetProps, // Original copied widget
    newWidget: FlattenedWidgetProps, // Newly generated widget
    widgetIdMap: Record<string, string>, // Map of oldWidgetId -> newWidgetId
  ): FlattenedWidgetProps | null {
    return null;
  }

  /* eslint-disable @typescript-eslint/no-unused-vars */
  static *performPasteOperation(
    allWidgets: CanvasWidgetsReduxState, // All widgets
    copiedWidgets: CopiedWidgetData[], // Original copied widgets
    destinationInfo: PasteDestinationInfo, // Destination info of copied widgets
    widgetIdMap: Record<string, string>, // Map of oldWidgetId -> newWidgetId
    reverseWidgetIdMap: Record<string, string>, // Map of newWidgetId -> oldWidgetId
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Generator<CallEffect<PastePayload>, PastePayload, any> {
    const res: PastePayload = yield call(function* () {
      return { widgets: allWidgets, widgetIdMap, reverseWidgetIdMap };
    });
    return res;
  }

  /**
   * getLoadingProperties returns a list of regexp's used to specify bindingPaths,
   * which can set the isLoading prop of the widget.
   * When:
   * 1. the path is bound to an action (API/Query)
   * 2. the action is currently in-progress
   *
   * if undefined, all paths can set the isLoading state
   * if empty array, no paths can set the isLoading state
   */
  static getLoadingProperties(): Array<RegExp> | undefined {
    return;
  }

  /**
   *  Widgets can execute actions using this `executeAction` method.
   *  Triggers may be specific to the widget
   */
  executeAction(actionPayload: ExecuteTriggerPayload): void {
    const { executeAction } = this.context;
    executeAction &&
      executeAction({
        ...actionPayload,
        source: {
          id: this.props.widgetId,
          name: this.props.widgetName,
        },
      });

    actionPayload.triggerPropertyName &&
      AppsmithConsole.info({
        text: `${actionPayload.triggerPropertyName} triggered`,
        source: {
          type: ENTITY_TYPE.WIDGET,
          id: this.props.widgetId,
          name: this.props.widgetName,
        },
      });
  }

  disableDrag(disable: boolean) {
    const { disableDrag } = this.context;
    disableDrag && disable !== undefined && disableDrag(disable);
  }

  updateWidget(
    operationName: string,
    widgetId: string,
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    widgetProperties: any,
  ): void {
    const { updateWidget } = this.context;
    updateWidget && updateWidget(operationName, widgetId, widgetProperties);
  }

  deleteWidgetProperty(propertyPaths: string[]): void {
    const { deleteWidgetProperty } = this.context;
    const { widgetId } = this.props;
    if (deleteWidgetProperty && widgetId) {
      deleteWidgetProperty(widgetId, propertyPaths);
    }
  }

  batchUpdateWidgetProperty(
    updates: BatchPropertyUpdatePayload,
    shouldReplay = true,
  ): void {
    const { batchUpdateWidgetProperty } = this.context;
    const { widgetId } = this.props;
    if (batchUpdateWidgetProperty && widgetId) {
      batchUpdateWidgetProperty(widgetId, updates, shouldReplay);
    }
  }

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateWidgetProperty(propertyName: string, propertyValue: any): void {
    this.batchUpdateWidgetProperty({
      modify: { [propertyName]: propertyValue },
    });
  }

  resetChildrenMetaProperty(widgetId: string) {
    const { resetChildrenMetaProperty } = this.context;
    if (resetChildrenMetaProperty) resetChildrenMetaProperty(widgetId);
  }

  selectWidgetRequest = (
    selectionRequestType: SelectionRequestType,
    payload?: string[],
  ) => {
    const { selectWidgetRequest } = this.context;
    if (selectWidgetRequest) {
      selectWidgetRequest(selectionRequestType, payload);
    }
  };

  unfocusWidget = () => {
    const { unfocusWidget } = this.context;
    if (unfocusWidget) {
      unfocusWidget();
    }
  };

  /* eslint-disable @typescript-eslint/no-empty-function */

  /* eslint-disable @typescript-eslint/no-unused-vars */
  componentDidUpdate(prevProps: T, prevState?: K) {
    if (
      !this.props.deferRender &&
      this.props.deferRender !== prevProps.deferRender
    ) {
      this.deferredComponentDidRender();
    }
  }

  componentDidMount(): void {}

  /*
   * With lazy rendering, skeleton loaders are rendered for below fold widgets.
   * This Appsmith widget life cycle method that gets called when the actual widget
   * component renders instead of the skeleton loader.
   */
  deferredComponentDidRender(): void {}

  /* eslint-enable @typescript-eslint/no-empty-function */

  modifyMetaWidgets = (modifications: ModifyMetaWidgetPayload) => {
    this.context.modifyMetaWidgets?.({
      ...modifications,
      creatorId: this.props.widgetId,
    });
  };

  deleteMetaWidgets = () => {
    this.context?.deleteMetaWidgets?.({
      creatorIds: [this.props.widgetId],
    });
  };

  setWidgetCache = (data: TCache) => {
    const key = this.getWidgetCacheKey();

    if (key) {
      this.context?.setWidgetCache?.(key, data);
    }
  };

  updateMetaWidgetProperty = (payload: UpdateMetaWidgetPropertyPayload) => {
    const { widgetId } = this.props;

    this.context.updateMetaWidgetProperty?.({
      ...payload,
      creatorId: widgetId,
    });
  };

  getWidgetCache = () => {
    const key = this.getWidgetCacheKey();

    if (key) {
      return this.context?.getWidgetCache?.(key);
    }
  };

  getWidgetCacheKey = () => {
    return this.props.metaWidgetId || this.props.widgetId;
  };

  setWidgetReferenceCache = <TRefCache,>(data: TRefCache) => {
    const key = this.getWidgetCacheReferenceKey();

    this.context?.setWidgetCache?.(`${key}.${REFERENCE_KEY}`, data);
  };

  getWidgetReferenceCache = <TRefCache,>() => {
    const key = this.getWidgetCacheReferenceKey();

    return this.context?.getWidgetCache?.<TRefCache>(`${key}.${REFERENCE_KEY}`);
  };

  getWidgetCacheReferenceKey = () => {
    return this.props.referencedWidgetId || this.props.widgetId;
  };

  render() {
    return this.getWidgetView();
  }

  get isAutoLayoutMode() {
    return this.props.layoutSystemType === LayoutSystemTypes.AUTO;
  }

  updateOneClickBindingOptionsVisibility(visibility: boolean) {
    const { updateOneClickBindingOptionsVisibility } = this.context;
    if (visibility) {
      this.selectWidgetRequest(SelectionRequestType.One, [this.props.widgetId]);
    }

    updateOneClickBindingOptionsVisibility?.(visibility);
  }

  abstract getWidgetView(): ReactNode;

  // TODO(abhinav): Maybe make this a pure component to bailout from updating altogether.
  // This would involve making all widgets which have "states" to not have states,
  // as they're extending this one.
  shouldComponentUpdate(nextProps: WidgetProps, nextState: WidgetState) {
    return (
      !shallowequal(nextProps, this.props) ||
      !shallowequal(nextState, this.state)
    );
  }

  // TODO(abhinav): These defaultProps seem unneccessary. Check it out.
  static defaultProps: Partial<WidgetProps> | undefined = {
    parentRowSpace: 1,
    parentColumnSpace: 1,
    topRow: 0,
    leftColumn: 0,
    isLoading: false,
    renderMode: RenderModes.CANVAS,
    dragDisabled: false,
    dropDisabled: false,
    isDeletable: true,
    resizeDisabled: false,
    disablePropertyPane: false,
    isFlexChild: false,
    isMobile: false,
  };

  /*
   * Function to get a specific feature flag
   * TODO(Keyur): To move the below function to the EditorContextProvider
   */
  static getFeatureFlag(featureFlag: FeatureFlag) {
    const state = store.getState();
    const featureFlags = selectFeatureFlags(state);

    return featureFlags[featureFlag];
  }
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

export const WIDGET_DISPLAY_PROPS = {
  isVisible: true,
  isLoading: true,
  isDisabled: true,
  backgroundColor: true,
};
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

export interface WidgetDataProps
  extends WidgetBaseProps,
    WidgetErrorProps,
    WidgetPositionProps,
    WidgetDisplayProps,
    WidgetCanvasProps {}

export interface WidgetProps
  extends WidgetDataProps,
    WidgetDynamicPathListProps,
    DataTreeEvaluationProps {
  key?: string;
  isDefaultClickDisabled?: boolean;

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export interface WidgetCardProps {
  rows: number;
  columns: number;
  type: WidgetType;
  key?: string;
  displayName: string;
  displayOrder?: number;
  icon: string;
  thumbnail?: string;
  isBeta?: boolean;
  tags?: WidgetTags[];
  isSearchWildcard?: boolean;
  IconCmp?: () => JSX.Element;
  ThumbnailCmp?: () => JSX.Element;
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

export default BaseWidget;
