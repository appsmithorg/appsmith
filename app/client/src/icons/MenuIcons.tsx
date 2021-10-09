import React from "react";
import { IconProps, IconWrapper } from "constants/IconConstants";
import WidgetsIcon from "remixicon-react/FunctionLineIcon";
import { ReactComponent as ApisIcon } from "assets/icons/menu/api.svg";
import { ReactComponent as OrgIcon } from "assets/icons/menu/org.svg";
import PageIcon from "remixicon-react/File3LineIcon";
import { ReactComponent as DataSourcesIcon } from "assets/icons/menu/data-sources.svg";
import { ReactComponent as QueriesIcon } from "assets/icons/menu/queries.svg";
import { ReactComponent as HomepageIcon } from "assets/icons/menu/homepage.svg";
import { ReactComponent as ExplorerIcon } from "assets/icons/menu/explorer.svg";
import { ReactComponent as ApisColoredIcon } from "assets/icons/menu/api-colored.svg";
import { ReactComponent as DataSourcesColoredIcon } from "assets/icons/menu/datasource-colored.svg";
import { ReactComponent as DatasourceTableIcon } from "assets/icons/menu/datasource-table.svg";
import { ReactComponent as PrimaryKeyIcon } from "assets/icons/menu/primary-key.svg";
import { ReactComponent as ForeignKeyIcon } from "assets/icons/menu/foreign-key.svg";
import { ReactComponent as DatasourceColumnIcon } from "assets/icons/menu/datasource-column.svg";
import { ReactComponent as WidgetsColoredIcon } from "assets/icons/menu/widgets-colored.svg";
import { ReactComponent as JSIcon } from "assets/icons/menu/js-group.svg";
import { ReactComponent as JSFileIcon } from "assets/icons/menu/js-file-icon.svg";
import { ReactComponent as LinkIcon } from "assets/icons/menu/link.svg";
import { ReactComponent as JSFunctionIcon } from "assets/icons/menu/js-function.svg";
import { ReactComponent as DataSourcesIconV2 } from "assets/icons/menu/datasources-2.svg";
import { ReactComponent as JSIconV2 } from "assets/icons/menu/js-icon.svg";
import { ReactComponent as QueryMain } from "assets/icons/menu/query-main.svg";
import DefaultHomeIcon from "remixicon-react/Home4LineIcon";
import EyeOff from "remixicon-react/EyeOffLineIcon";
import { Icon } from "@blueprintjs/core";
import styled from "styled-components";
import { Colors } from "constants/Colors";
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
  WIDGETS_ICON: ({
    background,
    className,
    color,
    cursor,
    disabled,
    height,
    keepColors,
    onClick,
    width,
  }: IconProps) => (
    <IconWrapper
      background={background}
      className={className}
      color={color}
      cursor={cursor}
      disabled={disabled}
      height={height}
      keepColors={keepColors}
      onClick={onClick}
      width={width}
    >
      <WidgetsIcon />
    </IconWrapper>
  ),
  JS_ICON: ({
    background,
    className,
    color,
    cursor,
    disabled,
    height,
    keepColors,
    onClick,
    width,
  }: IconProps) => (
    <IconWrapper
      background={background}
      className={className}
      color={color}
      cursor={cursor}
      disabled={disabled}
      height={height}
      keepColors={keepColors}
      onClick={onClick}
      width={width}
    >
      <JSIcon />
    </IconWrapper>
  ),
  JS_FILE_ICON: ({
    background,
    className,
    color,
    cursor,
    disabled,
    height,
    keepColors,
    onClick,
    width,
  }: IconProps) => (
    <IconWrapper
      background={background}
      className={className}
      color={color}
      cursor={cursor}
      disabled={disabled}
      height={height}
      keepColors={keepColors}
      onClick={onClick}
      width={width}
    >
      <JSFileIcon />
    </IconWrapper>
  ),
  JS_FUNCTION_ICON: ({
    background,
    className,
    color,
    cursor,
    disabled,
    height,
    keepColors,
    onClick,
    width,
  }: IconProps) => (
    <IconWrapper
      background={background}
      className={className}
      color={color}
      cursor={cursor}
      disabled={disabled}
      height={height}
      keepColors={keepColors}
      onClick={onClick}
      width={width}
    >
      <JSFunctionIcon />
    </IconWrapper>
  ),
  APIS_ICON: ({
    background,
    className,
    color,
    cursor,
    disabled,
    height,
    keepColors,
    onClick,
    width,
  }: IconProps) => (
    <IconWrapper
      background={background}
      className={className}
      color={color}
      cursor={cursor}
      disabled={disabled}
      height={height}
      keepColors={keepColors}
      onClick={onClick}
      width={width}
    >
      <ApisIcon />
    </IconWrapper>
  ),
  ORG_ICON: ({
    background,
    className,
    color,
    cursor,
    disabled,
    height,
    keepColors,
    onClick,
    width,
  }: IconProps) => (
    <IconWrapper
      background={background}
      className={className}
      color={color}
      cursor={cursor}
      disabled={disabled}
      height={height}
      keepColors={keepColors}
      onClick={onClick}
      width={width}
    >
      <OrgIcon />
    </IconWrapper>
  ),
  PAGES_ICON: ({
    background,
    className,
    color,
    cursor,
    disabled,
    height,
    keepColors,
    onClick,
    width,
  }: IconProps) => (
    <IconWrapper
      background={background}
      className={className}
      color={color}
      cursor={cursor}
      disabled={disabled}
      height={height}
      keepColors={keepColors}
      onClick={onClick}
      width={width}
    >
      <PageIcon />
    </IconWrapper>
  ),
  PAGE_ICON: ({
    background,
    className,
    color,
    cursor,
    disabled,
    height,
    keepColors,
    onClick,
    width,
  }: IconProps) => (
    <IconWrapper
      background={background}
      className={className}
      color={color}
      cursor={cursor}
      disabled={disabled}
      height={height}
      keepColors={keepColors}
      onClick={onClick}
      width={width}
    >
      <PageIcon />
    </IconWrapper>
  ),
  DATASOURCES_ICON: ({
    background,
    className,
    color,
    cursor,
    disabled,
    height,
    keepColors,
    onClick,
    width,
  }: IconProps) => (
    <IconWrapper
      background={background}
      className={className}
      color={color}
      cursor={cursor}
      disabled={disabled}
      height={height}
      keepColors={keepColors}
      onClick={onClick}
      width={width}
    >
      <DataSourcesIcon />
    </IconWrapper>
  ),
  QUERIES_ICON: ({
    background,
    className,
    color,
    cursor,
    disabled,
    height,
    keepColors,
    onClick,
    width,
  }: IconProps) => (
    <IconWrapper
      background={background}
      className={className}
      color={color}
      cursor={cursor}
      disabled={disabled}
      height={height}
      keepColors={keepColors}
      onClick={onClick}
      width={width}
    >
      <QueriesIcon />
    </IconWrapper>
  ),
  HOMEPAGE_ICON: ({
    background,
    className,
    color,
    cursor,
    disabled,
    height,
    keepColors,
    onClick,
    width,
  }: IconProps) => (
    <IconWrapper
      background={background}
      className={className}
      color={color}
      cursor={cursor}
      disabled={disabled}
      height={height}
      keepColors={keepColors}
      onClick={onClick}
      width={width}
    >
      <HomepageIcon />
    </IconWrapper>
  ),
  EXPLORER_ICON: ({
    background,
    className,
    color,
    cursor,
    disabled,
    height,
    keepColors,
    onClick,
    width,
  }: IconProps) => (
    <IconWrapper
      background={background}
      className={className}
      color={color}
      cursor={cursor}
      disabled={disabled}
      height={height}
      keepColors={keepColors}
      onClick={onClick}
      width={width}
    >
      <ExplorerIcon />
    </IconWrapper>
  ),
  DOCS_ICON: ({
    background,
    className,
    color,
    cursor,
    disabled,
    height,
    keepColors,
    onClick,
    width,
  }: IconProps) => (
    <IconWrapper
      background={background}
      className={className}
      color={color}
      cursor={cursor}
      disabled={disabled}
      height={height}
      keepColors={keepColors}
      onClick={onClick}
      width={width}
    >
      <Icon icon="help" />
    </IconWrapper>
  ),
  WIDGETS_COLORED_ICON: ({
    background,
    className,
    color,
    cursor,
    disabled,
    height,
    keepColors,
    onClick,
    width,
  }: IconProps) => (
    <IconWrapper
      background={background}
      className={className}
      color={color}
      cursor={cursor}
      disabled={disabled}
      height={height}
      keepColors={keepColors}
      onClick={onClick}
      width={width}
    >
      <WidgetsColoredIcon />
    </IconWrapper>
  ),
  APIS_COLORED_ICON: ({
    background,
    className,
    color,
    cursor,
    disabled,
    height,
    keepColors,
    onClick,
    width,
  }: IconProps) => (
    <IconWrapper
      background={background}
      className={className}
      color={color}
      cursor={cursor}
      disabled={disabled}
      height={height}
      keepColors={keepColors}
      onClick={onClick}
      width={width}
    >
      <ApisColoredIcon />
    </IconWrapper>
  ),
  DATASOURCES_COLORED_ICON: ({
    background,
    className,
    color,
    cursor,
    disabled,
    height,
    keepColors,
    onClick,
    width,
  }: IconProps) => (
    <IconWrapper
      background={background}
      className={className}
      color={color}
      cursor={cursor}
      disabled={disabled}
      height={height}
      keepColors={keepColors}
      onClick={onClick}
      width={width}
    >
      <DataSourcesColoredIcon />
    </IconWrapper>
  ),
  DATASOURCES_TABLE_ICON: ({
    background,
    className,
    color,
    cursor,
    disabled,
    height,
    keepColors,
    onClick,
    width,
  }: IconProps) => (
    <IconWrapper
      background={background}
      className={className}
      color={color}
      cursor={cursor}
      disabled={disabled}
      height={height}
      keepColors={keepColors}
      onClick={onClick}
      width={width}
    >
      <DatasourceTableIcon />
    </IconWrapper>
  ),
  PRIMARY_KEY_ICON: ({
    background,
    className,
    color,
    cursor,
    disabled,
    height,
    keepColors,
    onClick,
    width,
  }: IconProps) => (
    <IconWrapper
      background={background}
      className={className}
      color={color}
      cursor={cursor}
      disabled={disabled}
      height={height}
      keepColors={keepColors}
      onClick={onClick}
      width={width}
    >
      <PrimaryKeyIcon />
    </IconWrapper>
  ),
  FOREIGN_KEY_ICON: ({
    background,
    className,
    color,
    cursor,
    disabled,
    height,
    keepColors,
    onClick,
    width,
  }: IconProps) => (
    <IconWrapper
      background={background}
      className={className}
      color={color}
      cursor={cursor}
      disabled={disabled}
      height={height}
      keepColors={keepColors}
      onClick={onClick}
      width={width}
    >
      <ForeignKeyIcon />
    </IconWrapper>
  ),
  DATASOURCE_COLUMN_ICON: ({
    background,
    className,
    color,
    cursor,
    disabled,
    height,
    keepColors,
    onClick,
    width,
  }: IconProps) => (
    <IconWrapper
      background={background}
      className={className}
      color={color}
      cursor={cursor}
      disabled={disabled}
      height={height}
      keepColors={keepColors}
      onClick={onClick}
      width={width}
    >
      <DatasourceColumnIcon />
    </IconWrapper>
  ),
  LINK_ICON: ({
    background,
    className,
    color,
    cursor,
    disabled,
    height,
    keepColors,
    onClick,
    width,
  }: IconProps) => (
    <IconWrapper
      background={background}
      className={className}
      color={color}
      cursor={cursor}
      disabled={disabled}
      height={height}
      keepColors={keepColors}
      onClick={onClick}
      width={width}
    >
      <LinkIcon />
    </IconWrapper>
  ),
  DATASOURCE_ICON_v2: ({
    background,
    className,
    color,
    cursor,
    disabled,
    height,
    keepColors,
    onClick,
    width,
  }: IconProps) => (
    <IconWrapper
      background={background}
      className={className}
      color={color}
      cursor={cursor}
      disabled={disabled}
      height={height}
      keepColors={keepColors}
      onClick={onClick}
      width={width}
    >
      <StyledDataSourcesIconV2 />
    </IconWrapper>
  ),
  JS_ICON_V2: ({
    background,
    className,
    color,
    cursor,
    disabled,
    height,
    keepColors,
    onClick,
    width,
  }: IconProps) => (
    <IconWrapper
      background={background}
      className={className}
      color={color}
      cursor={cursor}
      disabled={disabled}
      height={height}
      keepColors={keepColors}
      onClick={onClick}
      width={width}
    >
      <StyledJSIconV2 />
    </IconWrapper>
  ),
  DEFAULT_HOMEPAGE_ICON: ({
    background,
    className,
    color,
    cursor,
    disabled,
    height,
    keepColors,
    onClick,
    width,
  }: IconProps) => (
    <IconWrapper
      background={background}
      className={className}
      color={color}
      cursor={cursor}
      disabled={disabled}
      height={height}
      keepColors={keepColors}
      onClick={onClick}
      width={width}
    >
      <DefaultHomeIcon />
    </IconWrapper>
  ),
  EYES_OFF_ICON: ({
    background,
    className,
    color,
    cursor,
    disabled,
    height,
    keepColors,
    onClick,
    width,
  }: IconProps) => (
    <IconWrapper
      background={background}
      className={className}
      color={color}
      cursor={cursor}
      disabled={disabled}
      height={height}
      keepColors={keepColors}
      onClick={onClick}
      width={width}
    >
      <EyeOff />
    </IconWrapper>
  ),
  QUERY_MAIN: ({
    background,
    className,
    color,
    cursor,
    disabled,
    height,
    keepColors,
    onClick,
    width,
  }: IconProps) => (
    <IconWrapper
      background={background}
      className={className}
      color={color}
      cursor={cursor}
      disabled={disabled}
      height={height}
      keepColors={keepColors}
      onClick={onClick}
      width={width}
    >
      <StyledQueryMain />
    </IconWrapper>
  ),
};
