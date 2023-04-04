import type {
  CanvasWidgetsReduxState,
  FlattenedWidgetProps,
} from "reducers/entityReducers/canvasWidgetsReducer";
import type {
  ConfigTree,
  DataTree,
  WidgetEntity,
  WidgetEntityConfig,
} from "entities/DataTree/dataTreeFactory";
import { ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import { pick } from "lodash";
import {
  WIDGET_DSL_STRUCTURE_PROPS,
  WIDGET_STATIC_PROPS,
} from "constants/WidgetConstants";
import WidgetFactory from "./WidgetFactory";
import type { WidgetProps } from "widgets/BaseWidget";
import type { LoadingEntitiesState } from "reducers/evaluationReducers/loadingEntitiesReducer";
import type { MetaWidgetsReduxState } from "reducers/entityReducers/metaWidgetsReducer";

export const createCanvasWidget = (
  canvasWidget: FlattenedWidgetProps,
  evaluatedWidget: WidgetEntity,
  evaluatedWidgetConfig: WidgetEntityConfig,
  specificChildProps?: string[],
) => {
  /**
   * WIDGET_DSL_STRUCTURE_PROPS is required for Building the List widget meta widgets
   *  requiresFlatWidgetChildren and hasMetaWidgets are the keys required.
   */

  const widgetStaticProps = pick(canvasWidget, [
    ...Object.keys({ ...WIDGET_STATIC_PROPS, ...WIDGET_DSL_STRUCTURE_PROPS }),
    ...(canvasWidget.additionalStaticProps || []),
  ]);

  //Pick required only contents for specific widgets
  const evaluatedStaticProps = specificChildProps
    ? pick(evaluatedWidget, specificChildProps)
    : evaluatedWidget;

  return {
    ...evaluatedStaticProps,
    ...evaluatedWidgetConfig,
    ...widgetStaticProps,
  } as any;
};

const WidgetTypes = WidgetFactory.widgetTypes;
export const createLoadingWidget = (
  canvasWidget: FlattenedWidgetProps,
): WidgetEntity => {
  const widgetStaticProps = pick(
    canvasWidget,
    Object.keys(WIDGET_STATIC_PROPS),
  ) as WidgetProps;
  return {
    ...widgetStaticProps,
    type: WidgetTypes.SKELETON_WIDGET,
    ENTITY_TYPE: ENTITY_TYPE.WIDGET,
    bindingPaths: {},
    reactivePaths: {},
    triggerPaths: {},
    validationPaths: {},
    logBlackList: {},
    isLoading: true,
    propertyOverrideDependency: {},
    overridingPropertyPaths: {},
    privateWidgets: {},
    meta: {},
  };
};

/**
 * Method to build a child widget tree
 * This method is used to build the child widgets array for widgets like Form, or List widget,
 * That need to know the state of its child or grandChild to derive properties
 * This can be replaced with deived properties of the individual widgets
 *
 * @param canvasWidgets
 * @param evaluatedDataTree
 * @param loadingEntities
 * @param widgetId
 * @param requiredWidgetProps
 * @returns
 */
export function buildChildWidgetTree(
  canvasWidgets: CanvasWidgetsReduxState,
  metaWidgets: MetaWidgetsReduxState,
  evaluatedDataTree: DataTree,
  loadingEntities: LoadingEntitiesState,
  configTree: ConfigTree,
  widgetId: string,
  requiredWidgetProps?: string[],
) {
  const parentWidget = canvasWidgets[widgetId] || metaWidgets[widgetId];

  // specificChildProps are the only properties required by the parent to derive it's properties
  const specificChildProps =
    requiredWidgetProps || getWidgetSpecificChildProps(parentWidget.type);

  if (parentWidget.children) {
    return parentWidget.children.map((childWidgetId) => {
      const childWidget =
        canvasWidgets[childWidgetId] || metaWidgets[childWidgetId];
      const evaluatedWidget = evaluatedDataTree[
        childWidget.widgetName
      ] as WidgetEntity;
      const evaluatedWidgetConfig = configTree[
        childWidget.widgetName
      ] as WidgetEntityConfig;
      const widget = evaluatedWidget
        ? createCanvasWidget(
            childWidget,
            evaluatedWidget,
            evaluatedWidgetConfig,
            specificChildProps,
          )
        : createLoadingWidget(childWidget);

      widget.isLoading = loadingEntities.has(childWidget.widgetName);

      if (widget?.children?.length > 0) {
        widget.children = buildChildWidgetTree(
          canvasWidgets,
          metaWidgets,
          evaluatedDataTree,
          loadingEntities,
          configTree,
          childWidgetId,
          specificChildProps,
        );
      }

      return widget;
    });
  }

  return [];
}

export function buildFlattenedChildCanvasWidgets(
  canvasWidgets: CanvasWidgetsReduxState,
  parentWidgetId: string,
  flattenedChildCanvasWidgets: Record<string, FlattenedWidgetProps> = {},
) {
  const parentWidget = canvasWidgets[parentWidgetId];
  parentWidget?.children?.forEach((childId) => {
    flattenedChildCanvasWidgets[childId] = canvasWidgets[childId];

    buildFlattenedChildCanvasWidgets(
      canvasWidgets,
      childId,
      flattenedChildCanvasWidgets,
    );
  });

  return flattenedChildCanvasWidgets;
}

function getWidgetSpecificChildProps(type: string) {
  if (type === "FORM_WIDGET") {
    return ["value", "isDirty", "isValid", "isLoading", "children"];
  }
}
