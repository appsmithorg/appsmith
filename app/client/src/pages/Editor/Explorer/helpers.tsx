import React from "react";
import Entity from "./Entity";
import { ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import { WidgetTypes } from "constants/WidgetConstants";
import {
  getWidgetIcon,
  pageIcon,
  apiIcon,
  widgetIcon,
  queryIcon,
} from "./ExplorerIcons";
import { PluginType, Action } from "entities/Action";
import { generateReactKey } from "utils/generators";
import { noop } from "lodash";

type GroupConfig = {
  groupName: string;
  type: PluginType;
  icon: JSX.Element;
  key: string;
};

// When we have new action plugins, we can just add it to this map
// There should be no other place where we refer to the PluginType in entity explorer.
export const ACTION_PLUGIN_MAP: Array<GroupConfig | undefined> = Object.keys(
  PluginType,
).map((type: string) => {
  switch (type) {
    case PluginType.API:
      return {
        groupName: "Apis",
        type,
        icon: apiIcon,
        key: generateReactKey(),
      };
    case PluginType.DB:
      return {
        groupName: "Queries",
        type,
        icon: queryIcon,
        key: generateReactKey(),
      };
    default:
      return undefined;
  }
});

const getEntityListItem = (entity: any, step: number, icon?: JSX.Element) => {
  switch (entity.ENTITY_TYPE) {
    case ENTITY_TYPE.WIDGET:
      if (entity.type === WidgetTypes.CANVAS_WIDGET) {
        return (
          entity.children &&
          entity.children.length > 0 &&
          entity.children.map((child: any) =>
            getEntityListItem(
              { ...child, ENTITY_TYPE: ENTITY_TYPE.WIDGET },
              step,
            ),
          )
        );
      }
      // TODO(abhinav): Let it pass when the Icon widget is available.
      if (entity.type === WidgetTypes.ICON_WIDGET) {
        return null;
      }
      return (
        <Entity
          key={entity.widgetId}
          icon={getWidgetIcon(entity.type)}
          name={entity.widgetName}
          step={step}
          action={noop}
        >
          {entity.children &&
            entity.children.length > 0 &&
            entity.children.map((child: any) =>
              getEntityListItem(
                { ...child, ENTITY_TYPE: ENTITY_TYPE.WIDGET },
                step,
              ),
            )}
        </Entity>
      );
    case ENTITY_TYPE.ACTION:
      return (
        <Entity
          key={entity.id}
          icon={icon}
          name={entity.name}
          step={step}
          action={noop}
        />
      );
  }
};

export const getPageEntityGroups = (
  page: { name: string; id: string },
  entityGroups: Array<{ type: ENTITY_TYPE; entries: any }>,
  isCurrentPage: boolean,
) => {
  const groups = entityGroups.map(group => {
    switch (group.type) {
      case ENTITY_TYPE.ACTION:
        return ACTION_PLUGIN_MAP?.map((config?: GroupConfig) => {
          const entries = group.entries.filter(
            (entry: { config: Action }) =>
              entry.config.pluginType === config?.type,
          );
          return (
            <Entity
              key={page.id + "_" + config?.type}
              icon={config?.icon}
              step={1}
              name={config?.groupName || "Actions"}
              disabled={!!entries.length}
              action={noop}
            >
              {entries.map((action: { config: Action }) =>
                getEntityListItem(action.config, 2, config?.icon),
              )}
            </Entity>
          );
        });
      case ENTITY_TYPE.WIDGET:
        return (
          <Entity
            key={page.id + "_widgets"}
            icon={widgetIcon}
            name="Widgets"
            step={1}
            disabled={false}
            action={noop}
          >
            {getEntityListItem(group.entries, 2)}
          </Entity>
        );
      default:
        return null;
    }
  });
  return (
    <Entity
      key={page.id}
      icon={pageIcon}
      name={page.name}
      step={0}
      disabled={!isCurrentPage}
      action={noop}
    >
      {groups}
    </Entity>
  );
};
