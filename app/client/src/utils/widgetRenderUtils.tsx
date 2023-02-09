import {
  CanvasWidgetsReduxState,
  FlattenedWidgetProps,
} from "reducers/entityReducers/canvasWidgetsReducer";
import {
  ConfigTree,
  DataTree,
  DataTreeWidget,
  ENTITY_TYPE,
  WidgetEntityConfig,
} from "entities/DataTree/dataTreeFactory";
import { pick } from "lodash";
import { WIDGET_STATIC_PROPS } from "constants/WidgetConstants";
import WidgetFactory from "./WidgetFactory";
import { WidgetProps } from "widgets/BaseWidget";
import { LoadingEntitiesState } from "reducers/evaluationReducers/loadingEntitiesReducer";

export const createCanvasWidget = (
  canvasWidget: FlattenedWidgetProps,
  evaluatedWidget: DataTreeWidget,
  evaluatedWidgetConfig: WidgetEntityConfig,
  specificChildProps?: string[],
) => {
  const widgetStaticProps = pick(
    canvasWidget,
    Object.keys(WIDGET_STATIC_PROPS),
  );

  //Pick required only contents for specific widgets
  const evaluatedStaticProps = specificChildProps
    ? pick(evaluatedWidget, specificChildProps)
    : evaluatedWidget;

  return {
    ...evaluatedStaticProps,
    ...evaluatedWidgetConfig,
    ...widgetStaticProps,
  } as WidgetEntityConfig;
};

const WidgetTypes = WidgetFactory.widgetTypes;
export const createLoadingWidget = (
  canvasWidget: FlattenedWidgetProps,
): DataTreeWidget => {
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
  evaluatedDataTree: DataTree,
  loadingEntities: LoadingEntitiesState,
  configTree: ConfigTree,
  widgetId: string,
  requiredWidgetProps?: string[],
) {
  const parentWidget = canvasWidgets[widgetId];

  // specificChildProps are the only properties required by the parent to derive it's properties
  const specificChildProps =
    requiredWidgetProps ||
    getWidgetSpecificChildProps(canvasWidgets[widgetId].type);

  if (parentWidget.children) {
    return parentWidget.children.map((childWidgetId) => {
      const childWidget = canvasWidgets[childWidgetId];
      const evaluatedWidget = evaluatedDataTree[
        childWidget.widgetName
      ] as DataTreeWidget;
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

function getWidgetSpecificChildProps(type: string) {
  if (type === "FORM_WIDGET") {
    return ["value", "isDirty", "isValid", "isLoading", "children"];
  }
}
