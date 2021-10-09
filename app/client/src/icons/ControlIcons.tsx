import React, { JSXElementConstructor } from "react";
import { IconProps, IconWrapper } from "constants/IconConstants";
import { ReactComponent as DeleteIcon } from "assets/icons/control/delete.svg";
import { ReactComponent as MoveIcon } from "assets/icons/control/move.svg";
import { ReactComponent as EditIcon } from "assets/icons/control/edit.svg";
import { ReactComponent as ViewIcon } from "assets/icons/control/view.svg";
import { ReactComponent as MoreVerticalIcon } from "assets/icons/control/more-vertical.svg";
import { ReactComponent as OverflowMenuIcon } from "assets/icons/menu/overflow-menu.svg";
import { ReactComponent as JsToggleIcon } from "assets/icons/control/js-toggle.svg";
import { ReactComponent as IncreaseIcon } from "assets/icons/control/increase.svg";
import { ReactComponent as DecreaseIcon } from "assets/icons/control/decrease.svg";
import { ReactComponent as DraggableIcon } from "assets/icons/control/draggable.svg";
import { ReactComponent as CloseCircleIcon } from "assets/icons/control/close-circle.svg";
import { ReactComponent as AddCircleIcon } from "assets/icons/control/add-circle.svg";
import { ReactComponent as HelpIcon } from "assets/icons/control/help.svg";
import { ReactComponent as CollapseIcon } from "assets/icons/control/collapse.svg";
import { ReactComponent as PickMyLocationSelectedIcon } from "assets/icons/control/pick-location-selected.svg";
import { ReactComponent as RemoveIcon } from "assets/icons/control/remove.svg";
import { ReactComponent as DragIcon } from "assets/icons/control/drag.svg";
import { ReactComponent as SortIcon } from "assets/icons/control/sort-icon.svg";
import { ReactComponent as EditWhiteIcon } from "assets/icons/control/edit-white.svg";
import { ReactComponent as LaunchIcon } from "assets/icons/control/launch.svg";
import { ReactComponent as BackIcon } from "assets/icons/control/back.svg";
import { ReactComponent as DeleteColumnIcon } from "assets/icons/control/delete-column.svg";
import { ReactComponent as BoldFontIcon } from "assets/icons/control/bold.svg";
import { ReactComponent as UnderlineIcon } from "assets/icons/control/underline.svg";
import { ReactComponent as ItalicsFontIcon } from "assets/icons/control/italics.svg";
import { ReactComponent as LeftAlignIcon } from "assets/icons/control/left-align.svg";
import { ReactComponent as CenterAlignIcon } from "assets/icons/control/center-align.svg";
import { ReactComponent as RightAlignIcon } from "assets/icons/control/right-align.svg";
import { ReactComponent as VerticalAlignBottom } from "assets/icons/control/vertical_align_bottom.svg";
import { ReactComponent as VerticalAlignCenter } from "assets/icons/control/vertical_align_center.svg";
import { ReactComponent as VerticalAlignTop } from "assets/icons/control/vertical_align_top.svg";
import { ReactComponent as Copy2Icon } from "assets/icons/control/copy2.svg";
import { ReactComponent as CutIcon } from "assets/icons/control/cut.svg";
import { ReactComponent as GroupIcon } from "assets/icons/control/group.svg";
import { ReactComponent as HeadingOneIcon } from "assets/icons/control/heading_1.svg";
import { ReactComponent as HeadingTwoIcon } from "assets/icons/control/heading_2.svg";
import { ReactComponent as HeadingThreeIcon } from "assets/icons/control/heading_3.svg";
import { ReactComponent as ParagraphIcon } from "assets/icons/control/paragraph.svg";
import { ReactComponent as ParagraphTwoIcon } from "assets/icons/control/paragraph_2.svg";
import { ReactComponent as BulletsIcon } from "assets/icons/control/bullets.svg";
import { ReactComponent as DividerCapRightIcon } from "assets/icons/control/divider_cap_right.svg";
import { ReactComponent as DividerCapLeftIcon } from "assets/icons/control/divider_cap_left.svg";
import { ReactComponent as DividerCapAllIcon } from "assets/icons/control/divider_cap_all.svg";
import { ReactComponent as TrendingFlat } from "assets/icons/ads/trending-flat.svg";
import { ReactComponent as AlignLeftIcon } from "assets/icons/control/align_left.svg";
import { ReactComponent as AlignRightIcon } from "assets/icons/control/align_right.svg";
import { ReactComponent as BorderRadiusSharpIcon } from "assets/icons/control/border-radius-sharp.svg";
import { ReactComponent as BorderRadiusRoundedIcon } from "assets/icons/control/border-radius-rounded.svg";
import { ReactComponent as BorderRadiusCircleIcon } from "assets/icons/control/border-radius-circle.svg";
import { ReactComponent as BoxShadowNoneIcon } from "assets/icons/control/box-shadow-none.svg";
import { ReactComponent as BoxShadowVariant1Icon } from "assets/icons/control/box-shadow-variant1.svg";
import { ReactComponent as BoxShadowVariant2Icon } from "assets/icons/control/box-shadow-variant2.svg";
import { ReactComponent as BoxShadowVariant3Icon } from "assets/icons/control/box-shadow-variant3.svg";
import { ReactComponent as BoxShadowVariant4Icon } from "assets/icons/control/box-shadow-variant4.svg";
import { ReactComponent as BoxShadowVariant5Icon } from "assets/icons/control/box-shadow-variant5.svg";
import IncreaseV2Icon from "remixicon-react/AddCircleLineIcon";
import PlayIcon from "assets/icons/control/play-icon.png";
import CopyIcon from "remixicon-react/FileCopyLineIcon";
import QuestionIcon from "remixicon-react/QuestionLineIcon";
import SettingsIcon from "remixicon-react/Settings5LineIcon";
import EyeIcon from "remixicon-react/EyeLineIcon";
import EyeOffIcon from "remixicon-react/EyeOffLineIcon";
import CloseIcon from "remixicon-react/CloseLineIcon";

/* eslint-disable react/display-name */

export const ControlIcons: {
  [id: string]: JSXElementConstructor<IconProps>;
} = {
  DELETE_CONTROL: ({
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
      <DeleteIcon />
    </IconWrapper>
  ),
  MOVE_CONTROL: ({
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
      <MoveIcon />
    </IconWrapper>
  ),
  EDIT_CONTROL: ({
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
      <EditIcon />
    </IconWrapper>
  ),
  VIEW_CONTROL: ({
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
      <ViewIcon />
    </IconWrapper>
  ),
  MORE_VERTICAL_CONTROL: ({
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
      <MoreVerticalIcon />
    </IconWrapper>
  ),
  MORE_HORIZONTAL_CONTROL: ({
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
      <OverflowMenuIcon />
    </IconWrapper>
  ),
  JS_TOGGLE: ({
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
      <JsToggleIcon />
    </IconWrapper>
  ),
  INCREASE_CONTROL: ({
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
      <IncreaseIcon />
    </IconWrapper>
  ),
  DECREASE_CONTROL: ({
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
      <DecreaseIcon />
    </IconWrapper>
  ),
  DRAGGABLE_CONTROL: ({
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
      <DraggableIcon />
    </IconWrapper>
  ),
  CLOSE_CONTROL: ({
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
      <CloseIcon />
    </IconWrapper>
  ),
  CLOSE_CIRCLE_CONTROL: ({
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
      <CloseCircleIcon />
    </IconWrapper>
  ),
  ADD_CIRCLE_CONTROL: ({
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
      <AddCircleIcon />
    </IconWrapper>
  ),
  PICK_MY_LOCATION_SELECTED_CONTROL: ({
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
      <PickMyLocationSelectedIcon />
    </IconWrapper>
  ),
  SETTINGS_CONTROL: ({
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
      <SettingsIcon />
    </IconWrapper>
  ),
  HELP_CONTROL: ({
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
      <HelpIcon />
    </IconWrapper>
  ),
  PLAY_VIDEO: ({
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
      <img
        alt="Datasource"
        src={PlayIcon}
        style={{ height: "30px", width: "30px" }}
      />
    </IconWrapper>
  ),
  REMOVE_CONTROL: ({
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
      <RemoveIcon />
    </IconWrapper>
  ),
  DRAG_CONTROL: ({
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
      <DragIcon />
    </IconWrapper>
  ),
  COLLAPSE_CONTROL: ({
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
      <CollapseIcon />
    </IconWrapper>
  ),
  SORT_CONTROL: ({
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
      <SortIcon />
    </IconWrapper>
  ),
  EDIT_WHITE: ({
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
      <EditWhiteIcon />
    </IconWrapper>
  ),
  LAUNCH_CONTROL: ({
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
      <LaunchIcon />
    </IconWrapper>
  ),
  BACK_CONTROL: ({
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
      <BackIcon />
    </IconWrapper>
  ),
  SHOW_COLUMN: ({
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
      <EyeIcon />
    </IconWrapper>
  ),
  HIDE_COLUMN: ({
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
      <EyeOffIcon />
    </IconWrapper>
  ),
  DELETE_COLUMN: ({
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
      <DeleteColumnIcon />
    </IconWrapper>
  ),
  BOLD_FONT: ({
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
      <BoldFontIcon />
    </IconWrapper>
  ),
  UNDERLINE: ({
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
      <UnderlineIcon />
    </IconWrapper>
  ),
  ITALICS_FONT: ({
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
      <ItalicsFontIcon />
    </IconWrapper>
  ),
  LEFT_ALIGN: ({
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
      <LeftAlignIcon />
    </IconWrapper>
  ),
  CENTER_ALIGN: ({
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
      <CenterAlignIcon />
    </IconWrapper>
  ),
  RIGHT_ALIGN: ({
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
      <RightAlignIcon />
    </IconWrapper>
  ),
  VERTICAL_TOP: ({
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
      <VerticalAlignTop />
    </IconWrapper>
  ),
  VERTICAL_CENTER: ({
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
      <VerticalAlignCenter />
    </IconWrapper>
  ),
  VERTICAL_BOTTOM: ({
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
      <VerticalAlignBottom />
    </IconWrapper>
  ),
  COPY_CONTROL: ({
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
      <CopyIcon />
    </IconWrapper>
  ),
  COPY2_CONTROL: ({
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
      <Copy2Icon />
    </IconWrapper>
  ),
  CUT_CONTROL: ({
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
      <CutIcon />
    </IconWrapper>
  ),
  GROUP_CONTROL: ({
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
      <GroupIcon />
    </IconWrapper>
  ),
  HEADING_ONE: ({
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
      <HeadingOneIcon />
    </IconWrapper>
  ),
  HEADING_TWO: ({
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
      <HeadingTwoIcon />
    </IconWrapper>
  ),
  HEADING_THREE: ({
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
      <HeadingThreeIcon />
    </IconWrapper>
  ),
  PARAGRAPH: ({
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
      <ParagraphIcon />
    </IconWrapper>
  ),
  PARAGRAPH_TWO: ({
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
      <ParagraphTwoIcon />
    </IconWrapper>
  ),
  BULLETS: ({
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
      <BulletsIcon />
    </IconWrapper>
  ),
  DIVIDER_CAP_RIGHT: ({
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
      <DividerCapRightIcon />
    </IconWrapper>
  ),
  DIVIDER_CAP_LEFT: ({
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
      <DividerCapLeftIcon />
    </IconWrapper>
  ),
  DIVIDER_CAP_ALL: ({
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
      <DividerCapAllIcon />
    </IconWrapper>
  ),
  BIND_DATA_CONTROL: ({
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
      <TrendingFlat />
    </IconWrapper>
  ),
  ICON_ALIGN_LEFT: ({
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
      <AlignLeftIcon />
    </IconWrapper>
  ),
  ICON_ALIGN_RIGHT: ({
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
      <AlignRightIcon />
    </IconWrapper>
  ),
  BORDER_RADIUS_SHARP: ({
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
      <BorderRadiusSharpIcon />
    </IconWrapper>
  ),
  BORDER_RADIUS_ROUNDED: ({
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
      <BorderRadiusRoundedIcon />
    </IconWrapper>
  ),
  BORDER_RADIUS_CIRCLE: ({
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
      <BorderRadiusCircleIcon />
    </IconWrapper>
  ),
  BOX_SHADOW_NONE: ({
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
      <BoxShadowNoneIcon />
    </IconWrapper>
  ),
  BOX_SHADOW_VARIANT1: ({
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
      <BoxShadowVariant1Icon />
    </IconWrapper>
  ),
  BOX_SHADOW_VARIANT2: ({
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
      <BoxShadowVariant2Icon />
    </IconWrapper>
  ),
  BOX_SHADOW_VARIANT3: ({
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
      <BoxShadowVariant3Icon />
    </IconWrapper>
  ),
  BOX_SHADOW_VARIANT4: ({
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
      <BoxShadowVariant4Icon />
    </IconWrapper>
  ),
  BOX_SHADOW_VARIANT5: ({
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
      <BoxShadowVariant5Icon />
    </IconWrapper>
  ),
  INCREASE_CONTROL_V2: ({
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
      <IncreaseV2Icon />
    </IconWrapper>
  ),
  QUESTION: ({
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
      <QuestionIcon />
    </IconWrapper>
  ),
};

export type ControlIconName = keyof typeof ControlIcons;
