import React from "react";
import EntityPlaceholder from "../Entity/Placeholder";
import Entity from "../Entity";
import { widgetIcon } from "../ExplorerIcons";
import { noop } from "lodash";
import WidgetEntity, { WidgetTree } from "./WidgetEntity";
import { WidgetTypes } from "constants/WidgetConstants";

const getWidgetEntity = (entity: any, step: number, parentModalId?: string) => {
  if (entity.type === WidgetTypes.CANVAS_WIDGET) {
    if (!entity.children || entity.children.length === 0) return;
    return entity.children.map((child: any) =>
      getWidgetEntity(child, step + 1, parentModalId),
    );
  }
  const childEntities =
    entity.children &&
    entity.children.length > 0 &&
    entity.children.map((child: any) =>
      getWidgetEntity(
        child,
        step,
        entity.type === WidgetTypes.MODAL_WIDGET ? entity.widgetId : undefined,
      ),
    );

  return (
    <WidgetEntity
      widgetProps={entity}
      step={step}
      key={entity.widgetId}
      parentModalId={parentModalId}
    >
      {childEntities}
    </WidgetEntity>
  );
};

type ExplorerWidgetGroupProps = {
  isFiltered: boolean;
  pageId: string;
  step: number;
  widgets: WidgetTree | null;
};

export const ExplorerWidgetGroup = (props: ExplorerWidgetGroupProps) => {
  let childNode = getWidgetEntity(props.widgets, props.step);
  if (!childNode && !props.isFiltered) {
    childNode = (
      <EntityPlaceholder step={props.step + 1}>
        No widgets yet. Please click the <strong>Widgets</strong> navigation
        menu icon on the left to drag and drop widgets
      </EntityPlaceholder>
    );
  }
  return (
    <Entity
      key={props.pageId + "_widgets"}
      icon={widgetIcon}
      step={props.step}
      name="Widgets"
      action={noop}
      disabled={!props.widgets && props.isFiltered}
      entityId={props.pageId + "_widgets"}
    >
      {childNode}
    </Entity>
  );
};

export default ExplorerWidgetGroup;
