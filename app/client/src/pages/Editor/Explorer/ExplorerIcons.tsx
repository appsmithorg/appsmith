import React from "react";
import { MenuIcons } from "icons/MenuIcons";
import { Colors } from "constants/Colors";
import { WidgetType } from "constants/WidgetConstants";
import { WidgetIcons } from "icons/WidgetIcons";
import { Plugin } from "api/PluginApi";
import ImageAlt from "assets/images/placeholder-image.svg";
import styled from "styled-components";
import {
  HTTP_METHODS,
  HTTP_METHOD_COLOR_MAP,
} from "constants/ApiEditorConstants";

const ENTITY_ICON_SIZE = 14;

const PagesIcon = MenuIcons.PAGES_ICON;
export const pageGroupIcon = (
  <PagesIcon
    width={ENTITY_ICON_SIZE}
    height={ENTITY_ICON_SIZE}
    color={Colors.ALTO}
  />
);

const PageIcon = MenuIcons.PAGE_ICON;
export const pageIcon = (
  <PageIcon
    width={ENTITY_ICON_SIZE}
    height={ENTITY_ICON_SIZE}
    color={Colors.ALTO}
  />
);

const WidgetIcon = MenuIcons.WIDGETS_COLORED_ICON;
export const widgetIcon = (
  <WidgetIcon width={ENTITY_ICON_SIZE} height={ENTITY_ICON_SIZE} keepColors />
);

const ApiIcon = MenuIcons.APIS_COLORED_ICON;
export const apiIcon = (
  <ApiIcon width={ENTITY_ICON_SIZE} height={ENTITY_ICON_SIZE} keepColors />
);

const QueryIcon = MenuIcons.DATASOURCES_COLORED_ICON;
export const queryIcon = (
  <QueryIcon width={ENTITY_ICON_SIZE} height={ENTITY_ICON_SIZE} keepColors />
);

const DataSourceIcon = MenuIcons.DATASOURCES_ICON;
export const datasourceIcon = (
  <DataSourceIcon
    width={ENTITY_ICON_SIZE}
    height={ENTITY_ICON_SIZE}
    color={Colors.ALTO}
  />
);

export const getWidgetIcon = (type: WidgetType) => {
  const WidgetIcon = WidgetIcons[type];
  if (WidgetIcon)
    return <WidgetIcon width={ENTITY_ICON_SIZE} height={ENTITY_ICON_SIZE} />;
  return null;
};

const PluginIcon = styled.img`
  height: ${ENTITY_ICON_SIZE}px;
  width: ${ENTITY_ICON_SIZE}px;
  margin-right: 4px;
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
  background: ${props => props.color};
  display: flex;
  justify-content: center;
  align-items: center;
`;

export const MethodTag = (props: { type: typeof HTTP_METHODS[number] }) => {
  return (
    <StyledTag color={HTTP_METHOD_COLOR_MAP[props.type]}>
      {props.type}
    </StyledTag>
  );
};
