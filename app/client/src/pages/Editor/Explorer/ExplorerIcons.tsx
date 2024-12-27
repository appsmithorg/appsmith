import type { ReactNode } from "react";
import React from "react";
import { MenuIcons } from "icons/MenuIcons";
import type { Plugin } from "api/PluginApi";
import ImageAlt from "assets/images/placeholder-image.svg";
import styled from "styled-components";
import {
  HTTP_METHODS_COLOR,
  type HTTP_METHOD,
} from "PluginActionEditor/constants/CommonApiConstants";
import { PRIMARY_KEY, FOREIGN_KEY } from "constants/DatasourceEditorConstants";
import { Icon } from "@appsmith/ads";
import { getAssetUrl } from "ee/utils/airgapHelpers";
import { importSvg } from "@appsmith/ads-old";
import WidgetFactory from "WidgetProvider/factory";
import WidgetTypeIcon from "pages/Editor/Explorer/Widgets/WidgetIcon";
import type { WidgetType } from "constants/WidgetConstants";

const ApiIcon = importSvg(
  async () => import("assets/icons/menu/api-colored.svg"),
);
const CurlIcon = importSvg(async () => import("assets/images/Curl-logo.svg"));
const GraphqlIcon = importSvg(
  async () => import("assets/images/Graphql-logo.svg"),
);
const AppsmithAISVG = importSvg(
  async () => import("assets/images/appsmith-ai.svg"),
);

export const ENTITY_ICON_SIZE = 16;

export const pageGroupIcon = <Icon name="home-3-line" size="md" />;

export const pageIcon = <Icon name="page-line" size="md" />;

export const homePageIcon = <Icon name="home-3-line" size="md" />;

export const defaultPageIcon = (
  <Icon data-testid="t--default-home-icon" name="home-3-line" size="md" />
);

export const hiddenPageIcon = <Icon name="eye-off" size="md" />;

const WidgetIcon = MenuIcons.WIDGETS_ICON;

export const widgetIcon = (
  <WidgetIcon height={ENTITY_ICON_SIZE} keepColors width={ENTITY_ICON_SIZE} />
);

const DBQueryIcon = MenuIcons.DATASOURCE_ICON_v2;

export const dbQueryIcon = (
  <DBQueryIcon height={ENTITY_ICON_SIZE} keepColors width={ENTITY_ICON_SIZE} />
);

const JSIcon = MenuIcons.JS_ICON_V2;

export const jsIcon = (
  <JSIcon height={ENTITY_ICON_SIZE} keepColors width={ENTITY_ICON_SIZE} />
);

const JSFileIcon = MenuIcons.JS_FILE_ICON;

export const jsFileIcon = (
  <JSFileIcon height={ENTITY_ICON_SIZE} keepColors width={ENTITY_ICON_SIZE} />
);

const JSFunctionIcon = MenuIcons.JS_FUNCTION_ICON;

export const jsFunctionIcon = (
  <JSFunctionIcon
    height={ENTITY_ICON_SIZE}
    keepColors
    width={ENTITY_ICON_SIZE}
  />
);

const QueryMainIcon = MenuIcons.QUERY_MAIN;

export function QueryIcon() {
  return (
    <QueryMainIcon
      color="var(--ads-v2-color-fg)"
      height={ENTITY_ICON_SIZE}
      width={ENTITY_ICON_SIZE}
    />
  );
}

const DataSourceIcon = MenuIcons.DATASOURCES_ICON;

export const datasourceIcon = (
  <DataSourceIcon
    color="var(--ads-v2-color-fg)"
    height={ENTITY_ICON_SIZE}
    width={ENTITY_ICON_SIZE}
  />
);

export const datasourceTableIcon = <Icon name="layout-5-line" size="md" />;

export const primaryKeyIcon = <Icon name="key-2-line" size="md" />;

export const foreignKeyIcon = <Icon name="key-2-line" size="md" />;

export const datasourceColumnIcon = (
  <Icon name="layout-column-line" size="md" />
);

export const DATASOURCE_FIELD_ICONS_MAP: Record<string, ReactNode> = {
  [PRIMARY_KEY]: primaryKeyIcon,
  [FOREIGN_KEY]: foreignKeyIcon,
};

const PluginIcon = styled.img`
  height: ${ENTITY_ICON_SIZE}px;
  width: ${ENTITY_ICON_SIZE}px;
`;

export const getPluginIcon = (plugin?: Plugin) => {
  if (plugin && plugin.iconLocation) {
    return (
      <PluginIcon
        alt={plugin.packageName}
        src={getAssetUrl(plugin.iconLocation)}
      />
    );
  }

  return <PluginIcon alt="plugin-placeholder" src={ImageAlt} />;
};

export const getPluginEntityIcon = (plugin?: Plugin) => {
  return <EntityIcon>{getPluginIcon(plugin)}</EntityIcon>;
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

export function MethodTag(props: { type: keyof typeof HTTP_METHOD }) {
  return (
    <StyledTag color={HTTP_METHODS_COLOR[props.type]}>{props.type}</StyledTag>
  );
}

const CurrentPageIcon = MenuIcons.CURRENT_PAGE_ICON;

export const currentPageIcon = (
  <CurrentPageIcon
    color="var(--ads-v2-color-fg)"
    height={ENTITY_ICON_SIZE}
    width={ENTITY_ICON_SIZE}
  />
);

const SortIcon = MenuIcons.SORT_ICON;

export const SortFileIcon = (
  <SortIcon
    color="var(--ads-v2-color-fg)"
    height={ENTITY_ICON_SIZE}
    width={ENTITY_ICON_SIZE}
  />
);

/**
 * Entity Icon components
 */

interface EntityTextIconProps {
  children: React.ReactNode;
  textColor?: string;
  fontSize?: number;
}

const EntityTextIconWrapper = styled.div<{ fontSize?: number; color?: string }>`
  color: ${({ color }) => (color ? color : "var(--ads-v2-color-fg)")};
  font-size: ${({ fontSize }) => fontSize + "%"};
  font-weight: 900;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 0 2px;
`;

// added fontSize prop to allow for dynamic sizing.
function EntityTextIcon(props: EntityTextIconProps): JSX.Element {
  return (
    <EntityTextIconWrapper color={props.textColor} fontSize={props.fontSize}>
      {props.children}
    </EntityTextIconWrapper>
  );
}

//border size is 8.5% of the height.
// (8.5% because for 18px of default height, the border is 1.5px).
//img and svg are set to 80% of the height to allow for the border to be visible and not cut off.
const EntityIconWrapper = styled.div<{
  borderColor?: string;
  width?: string;
  height?: string;
  noBorder?: boolean;
  noBackground?: boolean;
  bgColor?: string;
}>`
  height: ${({ height }) => (height ? height : "18px")};
  width: ${({ width }) => (width ? width : "18px")};
  background: ${({ bgColor }) => bgColor ?? "none"};
  border: ${({ borderColor, height }) =>
    borderColor
      ? `${parseInt(height ? height : "18px") * 0.0845}px solid ${borderColor}`
      : "none"};
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  border-radius: var(--ads-v2-border-radius);

  svg,
  img {
    height: 100% !important;
    width: 100% !important;
  }
`;

interface EntityIconType {
  children: React.ReactNode;
  borderColor?: string;
  width?: string;
  height?: string;
  noBorder?: boolean;
  noBackground?: boolean;
  bgColor?: string;
}

function EntityIcon(props: EntityIconType): JSX.Element {
  return (
    <EntityIconWrapper
      bgColor={props.bgColor}
      borderColor={props.borderColor}
      height={props.height}
      noBackground={props.noBackground}
      noBorder={props.noBorder}
      width={props.width}
    >
      {props.children}
    </EntityIconWrapper>
  );
}

EntityIcon.textIcon = EntityTextIcon;
export { EntityIcon };

/** ======= Entity Icon components ends ====== */

// height and width are set to 18px by default. This is to maintain the current icon sizes.
// fontSize is set to 56% by default.
export function ApiMethodIcon(
  type: keyof typeof HTTP_METHOD,
  height = "18px",
  width = "36px",
  fontSize = 52,
) {
  return (
    <EntityIcon
      borderColor={HTTP_METHODS_COLOR[type]}
      height={height}
      width={width}
    >
      <EntityIcon.textIcon
        fontSize={fontSize}
        textColor={HTTP_METHODS_COLOR[type]}
      >
        {type}
      </EntityIcon.textIcon>
    </EntityIcon>
  );
}

export function DefaultApiIcon() {
  return (
    <EntityIcon>
      <ApiIcon />
    </EntityIcon>
  );
}

export function CurlIconV2() {
  return (
    <EntityIcon>
      <CurlIcon />
    </EntityIcon>
  );
}

export function WorkflowIcon() {
  return (
    <EntityIcon>
      <Icon name="workflows" size="lg" />
    </EntityIcon>
  );
}

// height and width are set to 18px by default. This is to maintain the current icon sizes.
// fontSize is set to 56% by default.
export function JsFileIconV2(
  height = 18,
  width = 18,
  noBackground = false,
  noBorder = false,
) {
  return (
    <EntityIcon
      height={height + "px"}
      noBackground={noBackground}
      noBorder={noBorder}
      width={width + "px"}
    >
      <Icon name="js-yellow" size="md" />
    </EntityIcon>
  );
}

export function GraphQLIconV2() {
  return (
    <EntityIcon>
      <GraphqlIcon />
    </EntityIcon>
  );
}

export function AppsmithAIIcon() {
  return (
    <EntityIcon>
      <AppsmithAISVG />
    </EntityIcon>
  );
}

export function ActionUrlIcon(url: string) {
  return <img src={url} />;
}

export function DefaultModuleIcon() {
  return (
    <EntityIcon>
      <Icon name="module" size="sm" />
    </EntityIcon>
  );
}

export function WidgetIconByType(widgetType: WidgetType) {
  const { IconCmp } = WidgetFactory.getWidgetMethods(widgetType);

  return IconCmp ? <IconCmp /> : <WidgetTypeIcon type={widgetType} />;
}

export function GlobeIcon() {
  return <Icon name="global-line" size="md" />;
}
