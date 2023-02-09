import {
  entityDefinitions,
  EntityDefinitionsOptions,
} from "ce/utils/autocomplete/EntityDefinitions";
import {
  DataTree,
  DataTreeWidget,
  ENTITY_TYPE,
} from "entities/DataTree/dataTreeFactory";
import { isFunction } from "lodash";
import { FlattenedWidgetProps } from "reducers/entityReducers/canvasWidgetsReducer";
import { builderURL } from "RouteBuilder";
import { EntityNavigationData } from "selectors/navigationSelectors";
import { createNavData } from "./common";

export const getWidgetChildrenNavData = (
  widget: FlattenedWidgetProps,
  dataTree: DataTree,
  pageId: string,
) => {
  const peekData: Record<string, unknown> = {};
  const childNavData: EntityNavigationData = {};
  const dataTreeWidget: DataTreeWidget = dataTree[
    widget.widgetName
  ] as DataTreeWidget;
  if (widget.type === "FORM_WIDGET") {
    const children: EntityNavigationData = {};
    const formChildren: EntityNavigationData = {};
    if (dataTreeWidget) {
      Object.keys(dataTreeWidget.data || {}).forEach((widgetName) => {
        const childWidgetId = (dataTree[widgetName] as DataTreeWidget).widgetId;
        formChildren[widgetName] = createNavData(
          widgetName,
          `${widget.widgetName}.data.${widgetName}`,
          ENTITY_TYPE.WIDGET,
          true,
          builderURL({ pageId, hash: childWidgetId }),
          false,
          undefined,
          {},
        );
      });
    }
    children.data = createNavData(
      "data",
      `${widget.widgetName}.data`,
      ENTITY_TYPE.WIDGET,
      false,
      undefined,
      false,
      undefined,
      formChildren,
    );

    return { childNavData: children, peekData };
  }
  if (dataTreeWidget) {
    const type: Exclude<
      EntityDefinitionsOptions,
      | "CANVAS_WIDGET"
      | "ICON_WIDGET"
      | "SKELETON_WIDGET"
      | "TABS_MIGRATOR_WIDGET"
    > = dataTreeWidget.type as any;
    let config: any = entityDefinitions[type];
    if (config) {
      if (isFunction(config)) config = config(dataTreeWidget);
      const widgetProps = Object.keys(config).filter(
        (k) => k.indexOf("!") === -1,
      );
      widgetProps.forEach((prop) => {
        const data = dataTreeWidget[prop];
        peekData[prop] = data;
        childNavData[prop] = createNavData(
          `${widget.widgetName}.${prop}`,
          `${widget.widgetName}.${prop}`,
          ENTITY_TYPE.WIDGET,
          false,
          undefined,
          true,
          undefined,
          {},
        );
      });
    }
    return { childNavData, peekData };
  }
};
