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

import { ReactComponent as PickMyLocationSelectedIcon } from "assets/icons/control/pick-location-selected.svg";
import { ReactComponent as SettingsIcon } from "assets/icons/control/settings.svg";
import { ReactComponent as RemoveIcon } from "assets/icons/control/remove.svg";
import { ReactComponent as DragIcon } from "assets/icons/control/drag.svg";
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
};

export type ControlIconName = keyof typeof ControlIcons;
