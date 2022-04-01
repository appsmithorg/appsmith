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
import { ReactComponent as VerticalAlignRight } from "assets/icons/control/align_right.svg";
import { ReactComponent as VerticalAlignLeft } from "assets/icons/control/align_left.svg";
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
import IncreaseV2Icon from "remixicon-react/AddLineIcon";
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
  CLOSE_CIRCLE_CONTROL: (props: IconProps) => (
    <IconWrapper {...props}>
      <CloseCircleIcon />
    </IconWrapper>
  ),
  ADD_CIRCLE_CONTROL: (props: IconProps) => (
    <IconWrapper {...props}>
      <AddCircleIcon />
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
        alt="Datasource"
        src={PlayIcon}
        style={{ height: "30px", width: "30px" }}
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
      <EyeIcon />
    </IconWrapper>
  ),
  HIDE_COLUMN: (props: IconProps) => (
    <IconWrapper {...props}>
      <EyeOffIcon />
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
  UNDERLINE: (props: IconProps) => (
    <IconWrapper {...props}>
      <UnderlineIcon />
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
  VERTICAL_RIGHT: (props: IconProps) => (
    <IconWrapper {...props}>
      <VerticalAlignRight />
    </IconWrapper>
  ),
  VERTICAL_LEFT: (props: IconProps) => (
    <IconWrapper {...props}>
      <VerticalAlignLeft />
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
  COPY2_CONTROL: (props: IconProps) => (
    <IconWrapper {...props}>
      <Copy2Icon />
    </IconWrapper>
  ),
  CUT_CONTROL: (props: IconProps) => (
    <IconWrapper {...props}>
      <CutIcon />
    </IconWrapper>
  ),
  GROUP_CONTROL: (props: IconProps) => (
    <IconWrapper {...props}>
      <GroupIcon />
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
  DIVIDER_CAP_RIGHT: (props: IconProps) => (
    <IconWrapper {...props}>
      <DividerCapRightIcon />
    </IconWrapper>
  ),
  DIVIDER_CAP_LEFT: (props: IconProps) => (
    <IconWrapper {...props}>
      <DividerCapLeftIcon />
    </IconWrapper>
  ),
  DIVIDER_CAP_ALL: (props: IconProps) => (
    <IconWrapper {...props}>
      <DividerCapAllIcon />
    </IconWrapper>
  ),
  BIND_DATA_CONTROL: (props: IconProps) => (
    <IconWrapper {...props}>
      <TrendingFlat />
    </IconWrapper>
  ),
  ICON_ALIGN_LEFT: (props: IconProps) => (
    <IconWrapper {...props}>
      <AlignLeftIcon />
    </IconWrapper>
  ),
  ICON_ALIGN_RIGHT: (props: IconProps) => (
    <IconWrapper {...props}>
      <AlignRightIcon />
    </IconWrapper>
  ),
  BORDER_RADIUS_SHARP: (props: IconProps) => (
    <IconWrapper {...props}>
      <BorderRadiusSharpIcon />
    </IconWrapper>
  ),
  BORDER_RADIUS_ROUNDED: (props: IconProps) => (
    <IconWrapper {...props}>
      <BorderRadiusRoundedIcon />
    </IconWrapper>
  ),
  BORDER_RADIUS_CIRCLE: (props: IconProps) => (
    <IconWrapper {...props}>
      <BorderRadiusCircleIcon />
    </IconWrapper>
  ),
  BOX_SHADOW_NONE: (props: IconProps) => (
    <IconWrapper {...props}>
      <BoxShadowNoneIcon />
    </IconWrapper>
  ),
  BOX_SHADOW_VARIANT1: (props: IconProps) => (
    <IconWrapper {...props}>
      <BoxShadowVariant1Icon />
    </IconWrapper>
  ),
  BOX_SHADOW_VARIANT2: (props: IconProps) => (
    <IconWrapper {...props}>
      <BoxShadowVariant2Icon />
    </IconWrapper>
  ),
  BOX_SHADOW_VARIANT3: (props: IconProps) => (
    <IconWrapper {...props}>
      <BoxShadowVariant3Icon />
    </IconWrapper>
  ),
  BOX_SHADOW_VARIANT4: (props: IconProps) => (
    <IconWrapper {...props}>
      <BoxShadowVariant4Icon />
    </IconWrapper>
  ),
  BOX_SHADOW_VARIANT5: (props: IconProps) => (
    <IconWrapper {...props}>
      <BoxShadowVariant5Icon />
    </IconWrapper>
  ),
  INCREASE_CONTROL_V2: (props: IconProps) => (
    <IconWrapper {...props}>
      <IncreaseV2Icon />
    </IconWrapper>
  ),
  QUESTION: (props: IconProps) => (
    <IconWrapper {...props}>
      <QuestionIcon />
    </IconWrapper>
  ),
};

export type ControlIconName = keyof typeof ControlIcons;
