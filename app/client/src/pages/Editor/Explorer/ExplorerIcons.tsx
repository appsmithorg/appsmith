import React from "react";
import { MenuIcons } from "icons/MenuIcons";
import { Colors } from "constants/Colors";
import { WidgetType } from "constants/WidgetConstants";
import { WidgetIcons } from "icons/WidgetIcons";
import { Plugin } from "api/PluginApi";
import { REST_PLUGIN_PACKAGE_NAME } from "constants/ApiEditorConstants";
import {
  PLUGIN_PACKAGE_POSTGRES,
  PLUGIN_PACKAGE_MONGO,
} from "constants/QueryEditorConstants";
import ImageAlt from "assets/images/placeholder-image.svg";
import Postgres from "assets/images/Postgress.png";
import MongoDB from "assets/images/MongoDB.png";
import RestTemplateImage from "assets/images/RestAPI.png";
import styled from "styled-components";

const ENTITY_ICON_SIZE = 14;

const PageIcon = MenuIcons.PAGES_ICON;
export const pageIcon = (
  <PageIcon
    width={ENTITY_ICON_SIZE}
    height={ENTITY_ICON_SIZE}
    color={Colors.WHITE}
  />
);

const WidgetIcon = MenuIcons.WIDGETS_ICON;
export const widgetIcon = (
  <WidgetIcon
    width={ENTITY_ICON_SIZE}
    height={ENTITY_ICON_SIZE}
    color={Colors.WHITE}
  />
);

const ApiIcon = MenuIcons.APIS_ICON;
export const apiIcon = (
  <ApiIcon
    width={ENTITY_ICON_SIZE}
    height={ENTITY_ICON_SIZE}
    color={Colors.WHITE}
  />
);

const QueryIcon = MenuIcons.QUERIES_ICON;
export const queryIcon = (
  <QueryIcon
    width={ENTITY_ICON_SIZE}
    height={ENTITY_ICON_SIZE}
    color={Colors.WHITE}
  />
);

const DataSourceIcon = MenuIcons.DATASOURCES_ICON;
export const datasourceIcon = (
  <DataSourceIcon
    width={ENTITY_ICON_SIZE}
    height={ENTITY_ICON_SIZE}
    color={Colors.WHITE}
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
  switch (plugin?.packageName) {
    case REST_PLUGIN_PACKAGE_NAME:
      return (
        <PluginIcon alt={REST_PLUGIN_PACKAGE_NAME} src={RestTemplateImage} />
      );
    case PLUGIN_PACKAGE_MONGO:
      return <PluginIcon alt={PLUGIN_PACKAGE_MONGO} src={MongoDB} />;
    case PLUGIN_PACKAGE_POSTGRES:
      return <PluginIcon alt={PLUGIN_PACKAGE_POSTGRES} src={Postgres} />;
    default:
      return <PluginIcon alt="plugin-placeholder" src={ImageAlt} />;
  }
};
