import React, { JSXElementConstructor } from "react";
import { IconProps, IconWrapper } from "constants/IconConstants";
import { ReactComponent as SpinnerIcon } from "assets/icons/widget/alert.svg";
import { ReactComponent as ButtonIcon } from "assets/icons/widget/button.svg";
import { ReactComponent as CollapseIcon } from "assets/icons/widget/collapse.svg";
import { ReactComponent as ContainerIcon } from "assets/icons/widget/container.svg";
import { ReactComponent as DatePickerIcon } from "assets/icons/widget/datepicker.svg";
import { ReactComponent as TableIcon } from "assets/icons/widget/table.svg";
import { ReactComponent as VideoIcon } from "assets/icons/widget/video.svg";
import { ReactComponent as DropDownIcon } from "assets/icons/widget/dropdown.svg";
import { ReactComponent as MultiSelectIcon } from "assets/icons/widget/multiselect.svg";
import { ReactComponent as CheckboxIcon } from "assets/icons/widget/checkbox.svg";
import { ReactComponent as RadioGroupIcon } from "assets/icons/widget/radio.svg";
import { ReactComponent as InputIcon } from "assets/icons/widget/input.svg";
import { ReactComponent as SwitchIcon } from "assets/icons/widget/switch.svg";
import { ReactComponent as TextIcon } from "assets/icons/widget/text.svg";
import { ReactComponent as ImageIcon } from "assets/icons/widget/image.svg";
import { ReactComponent as FilePickerIcon } from "assets/icons/widget/filepicker.svg";
import { ReactComponent as TabsIcon } from "assets/icons/widget/tabs.svg";
import { ReactComponent as RichTextEditorIcon } from "assets/icons/widget/rich-text.svg";
import { ReactComponent as ChartIcon } from "assets/icons/widget/chart.svg";
import { ReactComponent as FormIcon } from "assets/icons/widget/form.svg";
import { ReactComponent as MapIcon } from "assets/icons/widget/map.svg";
import { ReactComponent as ModalIcon } from "assets/icons/widget/modal.svg";
import { ReactComponent as ListIcon } from "assets/icons/widget/list.svg";
import { ReactComponent as RatingIcon } from "assets/icons/widget/rating.svg";
import { ReactComponent as EmbedIcon } from "assets/icons/widget/embed.svg";
import { ReactComponent as DividerIcon } from "assets/icons/widget/divider.svg";
import { ReactComponent as MenuButtonIcon } from "assets/icons/widget/menu-button.svg";
import { ReactComponent as MultiTreeSelectIcon } from "assets/icons/widget/multi-tree-select.svg";
import { ReactComponent as SingleTreeSelectIcon } from "assets/icons/widget/single-tree-select.svg";
import { ReactComponent as IconButtonIcon } from "assets/icons/widget/icon-button.svg";
import { ReactComponent as StatboxIcon } from "assets/icons/widget/statbox.svg";
import { ReactComponent as CheckboxGroupIcon } from "assets/icons/widget/checkbox-group.svg";
import { ReactComponent as AudioRecorderIcon } from "assets/icons/widget/audio-recorder.svg";
import styled from "styled-components";
import { Colors } from "constants/Colors";

/* eslint-disable react/display-name */

const StyledIconWrapper = styled(IconWrapper)`
  svg {
    path {
      fill: ${Colors.CHARCOAL} !important;
    }
  }
`;

export const WidgetIcons: {
  [id: string]: JSXElementConstructor<IconProps>;
} = {
  SPINNER_WIDGET: ({
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
    <StyledIconWrapper
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
      <SpinnerIcon />
    </StyledIconWrapper>
  ),
  BUTTON_WIDGET: ({
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
    <StyledIconWrapper
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
      <ButtonIcon />
    </StyledIconWrapper>
  ),
  CHECKBOX_WIDGET: ({
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
    <StyledIconWrapper
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
      <CheckboxIcon />
    </StyledIconWrapper>
  ),
  COLLAPSE_WIDGET: ({
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
    <StyledIconWrapper
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
      <CollapseIcon />
    </StyledIconWrapper>
  ),
  CONTAINER_WIDGET: ({
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
    <StyledIconWrapper
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
      <ContainerIcon />
    </StyledIconWrapper>
  ),
  DATE_PICKER_WIDGET2: ({
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
    <StyledIconWrapper
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
      <DatePickerIcon />
    </StyledIconWrapper>
  ),
  TABLE_WIDGET: ({
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
    <StyledIconWrapper
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
      <TableIcon />
    </StyledIconWrapper>
  ),
  VIDEO_WIDGET: ({
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
    <StyledIconWrapper
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
      <VideoIcon />
    </StyledIconWrapper>
  ),
  DROP_DOWN_WIDGET: ({
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
    <StyledIconWrapper
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
      <DropDownIcon />
    </StyledIconWrapper>
  ),
  MULTI_SELECT_WIDGET: ({
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
    <StyledIconWrapper
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
      <MultiSelectIcon />
    </StyledIconWrapper>
  ),
  RADIO_GROUP_WIDGET: ({
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
    <StyledIconWrapper
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
      <RadioGroupIcon />
    </StyledIconWrapper>
  ),
  INPUT_WIDGET: ({
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
    <StyledIconWrapper
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
      <InputIcon />
    </StyledIconWrapper>
  ),
  RICH_TEXT_EDITOR_WIDGET: ({
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
    <StyledIconWrapper
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
      <RichTextEditorIcon />
    </StyledIconWrapper>
  ),
  SWITCH_WIDGET: ({
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
    <StyledIconWrapper
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
      <SwitchIcon />
    </StyledIconWrapper>
  ),
  TEXT_WIDGET: ({
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
    <StyledIconWrapper
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
      <TextIcon />
    </StyledIconWrapper>
  ),
  IMAGE_WIDGET: ({
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
    <StyledIconWrapper
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
      <ImageIcon />
    </StyledIconWrapper>
  ),
  FILE_PICKER_WIDGET_V2: ({
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
    <StyledIconWrapper
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
      <FilePickerIcon />
    </StyledIconWrapper>
  ),
  TABS_WIDGET: ({
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
    <StyledIconWrapper
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
      <TabsIcon />
    </StyledIconWrapper>
  ),
  CHART_WIDGET: ({
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
    <StyledIconWrapper
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
      <ChartIcon />
    </StyledIconWrapper>
  ),
  FORM_WIDGET: ({
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
    <StyledIconWrapper
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
      <FormIcon />
    </StyledIconWrapper>
  ),
  MAP_WIDGET: ({
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
    <StyledIconWrapper
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
      <MapIcon />
    </StyledIconWrapper>
  ),
  MODAL_WIDGET: ({
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
    <StyledIconWrapper
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
      <ModalIcon />
    </StyledIconWrapper>
  ),
  FORM_BUTTON_WIDGET: ({
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
    <StyledIconWrapper
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
      <ButtonIcon />
    </StyledIconWrapper>
  ),
  LIST_WIDGET: ({
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
    <StyledIconWrapper
      background={background}
      className={className}
      color={color}
      cursor={cursor}
      data-testid="list-widget-icon"
      disabled={disabled}
      height={height}
      keepColors={keepColors}
      onClick={onClick}
      width={width}
    >
      <ListIcon />
    </StyledIconWrapper>
  ),
  RATE_WIDGET: ({
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
    <StyledIconWrapper
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
      <RatingIcon />
    </StyledIconWrapper>
  ),
  IFRAME_WIDGET: ({
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
    <StyledIconWrapper
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
      <EmbedIcon />
    </StyledIconWrapper>
  ),
  DIVIDER_WIDGET: ({
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
    <StyledIconWrapper
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
      <DividerIcon />
    </StyledIconWrapper>
  ),
  MENU_BUTTON_WIDGET: ({
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
    <StyledIconWrapper
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
      <MenuButtonIcon />
    </StyledIconWrapper>
  ),
  TREE_SINGLE_SELECT_WIDGET: ({
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
    <StyledIconWrapper
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
      <SingleTreeSelectIcon />
    </StyledIconWrapper>
  ),
  TREE_MULTI_SELECT_WIDGET: ({
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
    <StyledIconWrapper
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
      <MultiTreeSelectIcon />
    </StyledIconWrapper>
  ),
  ICON_BUTTON_WIDGET: ({
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
    <StyledIconWrapper
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
      <IconButtonIcon />
    </StyledIconWrapper>
  ),
  STATBOX_WIDGET: ({
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
    <StyledIconWrapper
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
      <StatboxIcon />
    </StyledIconWrapper>
  ),
  CHECKBOX_GROUP_WIDGET: ({
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
    <StyledIconWrapper
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
      <CheckboxGroupIcon />
    </StyledIconWrapper>
  ),
  AUDIO_RECORDER_WIDGET: ({
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
    <StyledIconWrapper
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
      <AudioRecorderIcon />
    </StyledIconWrapper>
  ),
};

export type WidgetIcon = typeof WidgetIcons[keyof typeof WidgetIcons];
