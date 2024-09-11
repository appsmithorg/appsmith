import React from "react";
import type { IconProps } from "constants/IconConstants";
import { IconWrapper } from "constants/IconConstants";
import { Icon } from "@blueprintjs/core";
import styled from "styled-components";
import { Colors } from "constants/Colors";
import { Icon as DSIcon } from "@appsmith/ads";
import { importRemixIcon, importSvg } from "@appsmith/ads-old";

const ApisIcon = importSvg(async () => import("assets/icons/menu/api.svg"));
const WorkspaceIcon = importSvg(
  async () => import("assets/icons/menu/workspace.svg"),
);
const DataSourcesIcon = importSvg(
  async () => import("assets/icons/menu/data-sources.svg"),
);
const QueriesIcon = importSvg(
  async () => import("assets/icons/menu/queries.svg"),
);
const HomepageIcon = importSvg(
  async () => import("assets/icons/menu/homepage.svg"),
);
const ExplorerIcon = importSvg(
  async () => import("assets/icons/menu/explorer.svg"),
);
const ApisColoredIcon = importSvg(
  async () => import("assets/icons/menu/api-colored.svg"),
);
const DataSourcesColoredIcon = importSvg(
  async () => import("assets/icons/menu/datasource-colored.svg"),
);
const DatasourceTableIcon = importSvg(
  async () => import("assets/icons/menu/datasource-table.svg"),
);
const PrimaryKeyIcon = importSvg(
  async () => import("assets/icons/menu/primary-key.svg"),
);
const ForeignKeyIcon = importSvg(
  async () => import("assets/icons/menu/foreign-key.svg"),
);
const DatasourceColumnIcon = importSvg(
  async () => import("assets/icons/menu/datasource-column.svg"),
);
const WidgetsColoredIcon = importSvg(
  async () => import("assets/icons/menu/widgets-colored.svg"),
);
const JSIcon = importSvg(async () => import("assets/icons/menu/js-group.svg"));
const JSFileIcon = importSvg(
  async () => import("assets/icons/menu/js-file-icon.svg"),
);
const LinkIcon = importSvg(async () => import("assets/icons/menu/link.svg"));
const JSFunctionIcon = importSvg(
  async () => import("assets/icons/menu/js-function.svg"),
);
const DataSourcesIconV2 = importSvg(
  async () => import("assets/icons/menu/datasources-2.svg"),
);
const CurlIcon = importSvg(async () => import("assets/images/Curl-logo.svg"));
const JSIconV2 = importSvg(async () => import("assets/icons/menu/js-icon.svg"));
const QueryMain = importSvg(
  async () => import("assets/icons/menu/query-main.svg"),
);
const SortIcon = importRemixIcon(
  async () => import("remixicon-react/ArrowUpDownLineIcon"),
);
const GroupQueryIcon = importSvg(
  async () => import("assets/icons/menu/query-group.svg"),
);
const LibraryIcon = importSvg(
  async () => import("assets/icons/menu/library.svg"),
);

/* eslint-disable react/display-name */

const StyledDataSourcesIconV2 = styled(DataSourcesIconV2)`
  g {
    stroke: ${Colors.CHARCOAL};
  }
`;

const StyledJSIconV2 = styled(JSIconV2)`
  path {
    fill: ${Colors.CHARCOAL};
  }
`;

const StyledQueryMain = styled(QueryMain)`
  path {
    fill: ${Colors.CHARCOAL};
  }
`;

export const MenuIcons: {
  //TODO(abhinav): Fix this type to JSXElementConstructor<IconProps>
  // eslint-disable-next-line @typescript-eslint/ban-types
  [id: string]: Function;
} = {
  WIDGETS_ICON: (props: IconProps) => (
    <IconWrapper {...props}>
      <DSIcon name="widget" size="md" />
    </IconWrapper>
  ),
  JS_ICON: (props: IconProps) => (
    <IconWrapper {...props}>
      <JSIcon />
    </IconWrapper>
  ),
  JS_FILE_ICON: (props: IconProps) => (
    <IconWrapper {...props}>
      <JSFileIcon />
    </IconWrapper>
  ),
  JS_FUNCTION_ICON: (props: IconProps) => (
    <IconWrapper {...props}>
      <JSFunctionIcon />
    </IconWrapper>
  ),
  APIS_ICON: (props: IconProps) => (
    <IconWrapper {...props}>
      <ApisIcon />
    </IconWrapper>
  ),
  WORKSPACE_ICON: (props: IconProps) => (
    <IconWrapper {...props}>
      <WorkspaceIcon />
    </IconWrapper>
  ),
  PAGES_ICON: (props: IconProps) => (
    <IconWrapper {...props}>
      <DSIcon name="page-line" size="md" />
    </IconWrapper>
  ),
  PAGE_ICON: (props: IconProps) => (
    <IconWrapper {...props}>
      <DSIcon name="page-line" size="md" />
    </IconWrapper>
  ),
  DATASOURCES_ICON: (props: IconProps) => (
    <IconWrapper {...props}>
      <DataSourcesIcon />
    </IconWrapper>
  ),
  QUERIES_ICON: (props: IconProps) => (
    <IconWrapper {...props}>
      <QueriesIcon />
    </IconWrapper>
  ),
  HOMEPAGE_ICON: (props: IconProps) => (
    <IconWrapper {...props}>
      <HomepageIcon />
    </IconWrapper>
  ),
  EXPLORER_ICON: (props: IconProps) => (
    <IconWrapper {...props}>
      <ExplorerIcon />
    </IconWrapper>
  ),
  DOCS_ICON: (props: IconProps) => (
    <IconWrapper {...props}>
      <Icon icon="help" />
    </IconWrapper>
  ),
  WIDGETS_COLORED_ICON: (props: IconProps) => (
    <IconWrapper {...props}>
      <WidgetsColoredIcon />
    </IconWrapper>
  ),
  APIS_COLORED_ICON: (props: IconProps) => (
    <IconWrapper {...props}>
      <ApisColoredIcon />
    </IconWrapper>
  ),
  DATASOURCES_COLORED_ICON: (props: IconProps) => (
    <IconWrapper {...props}>
      <DataSourcesColoredIcon />
    </IconWrapper>
  ),
  DATASOURCES_TABLE_ICON: (props: IconProps) => (
    <IconWrapper {...props}>
      <DatasourceTableIcon />
    </IconWrapper>
  ),
  PRIMARY_KEY_ICON: (props: IconProps) => (
    <IconWrapper {...props}>
      <PrimaryKeyIcon />
    </IconWrapper>
  ),
  FOREIGN_KEY_ICON: (props: IconProps) => (
    <IconWrapper {...props}>
      <ForeignKeyIcon />
    </IconWrapper>
  ),
  DATASOURCE_COLUMN_ICON: (props: IconProps) => (
    <IconWrapper {...props}>
      <DatasourceColumnIcon />
    </IconWrapper>
  ),
  LINK_ICON: (props: IconProps) => (
    <IconWrapper {...props}>
      <LinkIcon />
    </IconWrapper>
  ),
  DATASOURCE_ICON_v2: (props: IconProps) => (
    <IconWrapper {...props}>
      <StyledDataSourcesIconV2 />
    </IconWrapper>
  ),
  JS_ICON_V2: (props: IconProps) => (
    <IconWrapper {...props}>
      <StyledJSIconV2 />
    </IconWrapper>
  ),
  DEFAULT_HOMEPAGE_ICON: (props: IconProps) => (
    <IconWrapper {...props}>
      <DSIcon name="home-3-line" />
    </IconWrapper>
  ),
  EYES_OFF_ICON: (props: IconProps) => (
    <IconWrapper {...props}>
      <DSIcon name="eye-off" size="md" />
    </IconWrapper>
  ),
  QUERY_MAIN: (props: IconProps) => (
    <IconWrapper {...props}>
      <StyledQueryMain />
    </IconWrapper>
  ),
  CURRENT_PAGE_ICON: (props: IconProps) => (
    <IconWrapper {...props}>
      <DSIcon name="check-line" size="md" />
    </IconWrapper>
  ),
  SORT_ICON: (props: IconProps) => (
    <IconWrapper {...props}>
      <SortIcon />
    </IconWrapper>
  ),
  CURL_ICON: (props: IconProps) => (
    <IconWrapper {...props}>
      <CurlIcon />
    </IconWrapper>
  ),
  GROUP_QUERY_ICON: (props: IconProps) => (
    <IconWrapper {...props}>
      <GroupQueryIcon />
    </IconWrapper>
  ),
  LIBRARY_ICON: (props: IconProps) => (
    <IconWrapper {...props}>
      <LibraryIcon />
    </IconWrapper>
  ),
};
