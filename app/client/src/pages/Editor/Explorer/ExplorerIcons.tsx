import React, { ReactNode } from "react";
import { MenuIcons } from "icons/MenuIcons";
import { Colors } from "constants/Colors";
import { WidgetType } from "constants/WidgetConstants";
import { WidgetIcons } from "icons/WidgetIcons";
import { Plugin } from "api/PluginApi";
import ImageAlt from "assets/images/placeholder-image.svg";
import QueryImageOutline from "assets/images/query-image-outline.png";
import styled from "styled-components";
import {
  HTTP_METHODS,
  HTTP_METHOD_COLOR_MAP,
} from "constants/ApiEditorConstants";
import { PRIMARY_KEY, FOREIGN_KEY } from "constants/DatasourceEditorConstants";
import { Icon } from "@blueprintjs/core";

const ENTITY_ICON_SIZE = 14;

const PagesIcon = MenuIcons.PAGES_ICON;
export const pageGroupIcon = (
  <PagesIcon
    color={Colors.ALTO}
    height={ENTITY_ICON_SIZE}
    width={ENTITY_ICON_SIZE}
  />
);

const PageIcon = MenuIcons.PAGE_ICON;
export const pageIcon = (
  <PageIcon
    color={Colors.ALTO}
    height={ENTITY_ICON_SIZE}
    width={ENTITY_ICON_SIZE}
  />
);

export const homePageIcon = (
  <Icon color={Colors.JUNGLE_GREEN} icon="home" iconSize={ENTITY_ICON_SIZE} />
);

export const hiddenPageIcon = (
  <Icon color={Colors.ALTO} icon="eye-off" iconSize={ENTITY_ICON_SIZE} />
);

const WidgetIcon = MenuIcons.WIDGETS_COLORED_ICON;
export const widgetIcon = (
  <WidgetIcon height={ENTITY_ICON_SIZE} keepColors width={ENTITY_ICON_SIZE} />
);

const ApiIcon = MenuIcons.APIS_COLORED_ICON;
export const apiIcon = (
  <ApiIcon height={ENTITY_ICON_SIZE} keepColors width={ENTITY_ICON_SIZE} />
);

const DBQueryIcon = MenuIcons.DATASOURCES_COLORED_ICON;
export const dbQueryIcon = (
  <DBQueryIcon height={ENTITY_ICON_SIZE} keepColors width={ENTITY_ICON_SIZE} />
);

const JSIcon = MenuIcons.JS_ICON;
export const jsIcon = (
  <JSIcon height={ENTITY_ICON_SIZE} keepColors width={ENTITY_ICON_SIZE} />
);

const JSFileIcon = MenuIcons.JS_FILE_ICON;
export const jsFileIcon = (
  <JSFileIcon height={ENTITY_ICON_SIZE} keepColors width={ENTITY_ICON_SIZE} />
);

const QueryIconWrapper = styled.div`
  position: relative;
  .inner-image {
    position: absolute;
    top: 5px;
    left: 1.1px;
    height: 11px;
    width: 11px;
  }
  .outer-image {
    height: 18px;
    width: 14px;
  }
`;

export function QueryIcon(props: { plugin: Plugin }) {
  return (
    <QueryIconWrapper>
      <img className="inner-image" src={props.plugin.iconLocation} />
      <img className="outer-image" src={QueryImageOutline} />
    </QueryIconWrapper>
  );
}

const DataSourceIcon = MenuIcons.DATASOURCES_ICON;
export const datasourceIcon = (
  <DataSourceIcon
    color={Colors.ALTO}
    height={ENTITY_ICON_SIZE}
    width={ENTITY_ICON_SIZE}
  />
);

const DataSourceTableIcon = MenuIcons.DATASOURCES_TABLE_ICON;
export const datasourceTableIcon = (
  <DataSourceTableIcon
    height={ENTITY_ICON_SIZE}
    keepColors
    width={ENTITY_ICON_SIZE}
  />
);

const PrimaryKeyIcon = MenuIcons.PRIMARY_KEY_ICON;
export const primaryKeyIcon = (
  <PrimaryKeyIcon
    height={ENTITY_ICON_SIZE}
    keepColors
    width={ENTITY_ICON_SIZE}
  />
);

export const ForeignKeyIcon = MenuIcons.FOREIGN_KEY_ICON;
export const foreignKeyIcon = (
  <ForeignKeyIcon
    height={ENTITY_ICON_SIZE}
    keepColors
    width={ENTITY_ICON_SIZE}
  />
);

const DatasourceColumnIcon = MenuIcons.DATASOURCE_COLUMN_ICON;
export const datasourceColumnIcon = (
  <DatasourceColumnIcon
    height={ENTITY_ICON_SIZE}
    keepColors
    width={ENTITY_ICON_SIZE}
  />
);

export const DATASOURCE_FIELD_ICONS_MAP: Record<string, ReactNode> = {
  [PRIMARY_KEY]: primaryKeyIcon,
  [FOREIGN_KEY]: foreignKeyIcon,
};

export const getWidgetIcon = (type: WidgetType) => {
  const WidgetIcon = WidgetIcons[type];
  if (WidgetIcon)
    return <WidgetIcon height={ENTITY_ICON_SIZE} width={ENTITY_ICON_SIZE} />;
  return null;
};

const PluginIcon = styled.img`
  height: ${ENTITY_ICON_SIZE}px;
  width: ${ENTITY_ICON_SIZE}px;
`;

export const getPluginIcon = (plugin?: Plugin) => {
  if (plugin && plugin.iconLocation) {
    return <PluginIcon alt={plugin.packageName} src={plugin.iconLocation} />;
  }
  return <PluginIcon alt="plugin-placeholder" src={ImageAlt} />;
};

const StyledTag = styled.div<{ color: string }>`
  font-size: 8px;
  width: 40px;
  font-weight: 700;
  color: #fff;
  background: ${(props) => props.color};
  display: flex;
  justify-content: center;
  align-items: center;
  line-height: 16px;
`;

export function MethodTag(props: { type: typeof HTTP_METHODS[number] }) {
  return (
    <StyledTag color={HTTP_METHOD_COLOR_MAP[props.type]}>
      {props.type}
    </StyledTag>
  );
}
