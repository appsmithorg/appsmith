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
import { ReactComponent as CloseIcon } from "assets/icons/control/close.svg";
import { ReactComponent as HelpIcon } from "assets/icons/control/help.svg";
import { ReactComponent as CollapseIcon } from "assets/icons/control/collapse.svg";
import { ReactComponent as PickMyLocationSelectedIcon } from "assets/icons/control/pick-location-selected.svg";
import { ReactComponent as SettingsIcon } from "assets/icons/control/settings.svg";
import { ReactComponent as RemoveIcon } from "assets/icons/control/remove.svg";
import { ReactComponent as DragIcon } from "assets/icons/control/drag.svg";
import { ReactComponent as SortIcon } from "assets/icons/control/sort-icon.svg";
import { ReactComponent as EditWhiteIcon } from "assets/icons/control/edit-white.svg";
import { ReactComponent as LaunchIcon } from "assets/icons/control/launch.svg";
import { ReactComponent as BackIcon } from "assets/icons/control/back.svg";
import { ReactComponent as ShowColumnIcon } from "assets/icons/control/hide-column.svg";
import { ReactComponent as HideColumnIcon } from "assets/icons/control/columns-visibility.svg";
import { ReactComponent as DeleteColumnIcon } from "assets/icons/control/delete-column.svg";
import { ReactComponent as BoldFontIcon } from "assets/icons/control/bold.svg";
import { ReactComponent as ItalicsFontIcon } from "assets/icons/control/italics.svg";
import { ReactComponent as LeftAlignIcon } from "assets/icons/control/left-align.svg";
import { ReactComponent as CenterAlignIcon } from "assets/icons/control/center-align.svg";
import { ReactComponent as RightAlignIcon } from "assets/icons/control/right-align.svg";
import { ReactComponent as VerticalAlignBottom } from "assets/icons/control/vertical_align_bottom.svg";
import { ReactComponent as VerticalAlignCenter } from "assets/icons/control/vertical_align_center.svg";
import { ReactComponent as VerticalAlignTop } from "assets/icons/control/vertical_align_top.svg";
import { ReactComponent as CopyIcon } from "assets/icons/control/copy.svg";
import { ReactComponent as HeadingOneIcon } from "assets/icons/control/heading_1.svg";
import { ReactComponent as HeadingTwoIcon } from "assets/icons/control/heading_2.svg";
import { ReactComponent as HeadingThreeIcon } from "assets/icons/control/heading_3.svg";
import { ReactComponent as ParagraphIcon } from "assets/icons/control/paragraph.svg";
import { ReactComponent as ParagraphTwoIcon } from "assets/icons/control/paragraph_2.svg";
import { ReactComponent as BulletsIcon } from "assets/icons/control/bullets.svg";
import PlayIcon from "assets/icons/control/play-icon.png";

/* eslint-disable react/display-name */

export const ControlIcons: {
  [id: string]: JSXElementConstructor<IconProps>;
} = {
  DELETE_CONTROL: (props: IconProps) => (
    <IconWrapper {...props}>
      <DeleteIcon />
    </IconWrapper>
  ),
  MOVE_CONTROL: (props: IconProps) => (
    <IconWrapper {...props}>
      <MoveIcon />
    </IconWrapper>
  ),
  EDIT_CONTROL: (props: IconProps) => (
    <IconWrapper {...props}>
      <EditIcon />
    </IconWrapper>
  ),
  VIEW_CONTROL: (props: IconProps) => (
    <IconWrapper {...props}>
      <ViewIcon />
    </IconWrapper>
  ),
  MORE_VERTICAL_CONTROL: (props: IconProps) => (
    <IconWrapper {...props}>
      <MoreVerticalIcon />
    </IconWrapper>
  ),
  MORE_HORIZONTAL_CONTROL: (props: IconProps) => (
    <IconWrapper {...props}>
      <OverflowMenuIcon />
    </IconWrapper>
  ),
  JS_TOGGLE: (props: IconProps) => (
    <IconWrapper {...props}>
      <JsToggleIcon />
    </IconWrapper>
  ),
  INCREASE_CONTROL: (props: IconProps) => (
    <IconWrapper {...props}>
      <IncreaseIcon />
    </IconWrapper>
  ),
  DECREASE_CONTROL: (props: IconProps) => (
    <IconWrapper {...props}>
      <DecreaseIcon />
    </IconWrapper>
  ),
  DRAGGABLE_CONTROL: (props: IconProps) => (
    <IconWrapper {...props}>
      <DraggableIcon />
    </IconWrapper>
  ),
  CLOSE_CONTROL: (props: IconProps) => (
    <IconWrapper {...props}>
      <CloseIcon />
    </IconWrapper>
  ),
  PICK_MY_LOCATION_SELECTED_CONTROL: (props: IconProps) => (
    <IconWrapper {...props}>
      <PickMyLocationSelectedIcon />
    </IconWrapper>
  ),
  SETTINGS_CONTROL: (props: IconProps) => (
    <IconWrapper {...props}>
      <SettingsIcon />
    </IconWrapper>
  ),
  HELP_CONTROL: (props: IconProps) => (
    <IconWrapper {...props}>
      <HelpIcon />
    </IconWrapper>
  ),
  PLAY_VIDEO: (props: IconProps) => (
    <IconWrapper {...props}>
      <img
        src={PlayIcon}
        style={{ height: "30px", width: "30px" }}
        alt="Datasource"
      />
    </IconWrapper>
  ),
  REMOVE_CONTROL: (props: IconProps) => (
    <IconWrapper {...props}>
      <RemoveIcon />
    </IconWrapper>
  ),
  DRAG_CONTROL: (props: IconProps) => (
    <IconWrapper {...props}>
      <DragIcon />
    </IconWrapper>
  ),
  COLLAPSE_CONTROL: (props: IconProps) => (
    <IconWrapper {...props}>
      <CollapseIcon />
    </IconWrapper>
  ),
  SORT_CONTROL: (props: IconProps) => (
    <IconWrapper {...props}>
      <SortIcon />
    </IconWrapper>
  ),
  EDIT_WHITE: (props: IconProps) => (
    <IconWrapper {...props}>
      <EditWhiteIcon />
    </IconWrapper>
  ),
  LAUNCH_CONTROL: (props: IconProps) => (
    <IconWrapper {...props}>
      <LaunchIcon />
    </IconWrapper>
  ),
  BACK_CONTROL: (props: IconProps) => (
    <IconWrapper {...props}>
      <BackIcon />
    </IconWrapper>
  ),
  SHOW_COLUMN: (props: IconProps) => (
    <IconWrapper {...props}>
      <ShowColumnIcon />
    </IconWrapper>
  ),
  HIDE_COLUMN: (props: IconProps) => (
    <IconWrapper {...props}>
      <HideColumnIcon />
    </IconWrapper>
  ),
  DELETE_COLUMN: (props: IconProps) => (
    <IconWrapper {...props}>
      <DeleteColumnIcon />
    </IconWrapper>
  ),
  BOLD_FONT: (props: IconProps) => (
    <IconWrapper {...props}>
      <BoldFontIcon />
    </IconWrapper>
  ),
  ITALICS_FONT: (props: IconProps) => (
    <IconWrapper {...props}>
      <ItalicsFontIcon />
    </IconWrapper>
  ),
  LEFT_ALIGN: (props: IconProps) => (
    <IconWrapper {...props}>
      <LeftAlignIcon />
    </IconWrapper>
  ),
  CENTER_ALIGN: (props: IconProps) => (
    <IconWrapper {...props}>
      <CenterAlignIcon />
    </IconWrapper>
  ),
  RIGHT_ALIGN: (props: IconProps) => (
    <IconWrapper {...props}>
      <RightAlignIcon />
    </IconWrapper>
  ),
  VERTICAL_TOP: (props: IconProps) => (
    <IconWrapper {...props}>
      <VerticalAlignTop />
    </IconWrapper>
  ),
  VERTICAL_CENTER: (props: IconProps) => (
    <IconWrapper {...props}>
      <VerticalAlignCenter />
    </IconWrapper>
  ),
  VERTICAL_BOTTOM: (props: IconProps) => (
    <IconWrapper {...props}>
      <VerticalAlignBottom />
    </IconWrapper>
  ),
  COPY_CONTROL: (props: IconProps) => (
    <IconWrapper {...props}>
      <CopyIcon />
    </IconWrapper>
  ),
  HEADING_ONE: (props: IconProps) => (
    <IconWrapper {...props}>
      <HeadingOneIcon />
    </IconWrapper>
  ),
  HEADING_TWO: (props: IconProps) => (
    <IconWrapper {...props}>
      <HeadingTwoIcon />
    </IconWrapper>
  ),
  HEADING_THREE: (props: IconProps) => (
    <IconWrapper {...props}>
      <HeadingThreeIcon />
    </IconWrapper>
  ),
  PARAGRAPH: (props: IconProps) => (
    <IconWrapper {...props}>
      <ParagraphIcon />
    </IconWrapper>
  ),
  PARAGRAPH_TWO: (props: IconProps) => (
    <IconWrapper {...props}>
      <ParagraphTwoIcon />
    </IconWrapper>
  ),
  BULLETS: (props: IconProps) => (
    <IconWrapper {...props}>
      <BulletsIcon />
    </IconWrapper>
  ),
};

export type ControlIconName = keyof typeof ControlIcons;
