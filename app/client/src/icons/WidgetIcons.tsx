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
import { ReactComponent as IconButtonIcon } from "assets/icons/widget/icon-button.svg";
import { ReactComponent as RecorderIcon } from "assets/icons/widget/recorder.svg";

/* eslint-disable react/display-name */

export const WidgetIcons: {
  [id: string]: JSXElementConstructor<IconProps>;
} = {
  SPINNER_WIDGET: (props: IconProps) => (
    <IconWrapper {...props}>
      <SpinnerIcon />
    </IconWrapper>
  ),
  BUTTON_WIDGET: (props: IconProps) => (
    <IconWrapper {...props}>
      <ButtonIcon />
    </IconWrapper>
  ),
  CHECKBOX_WIDGET: (props: IconProps) => (
    <IconWrapper {...props}>
      <CheckboxIcon />
    </IconWrapper>
  ),
  COLLAPSE_WIDGET: (props: IconProps) => (
    <IconWrapper {...props}>
      <CollapseIcon />
    </IconWrapper>
  ),
  CONTAINER_WIDGET: (props: IconProps) => (
    <IconWrapper {...props}>
      <ContainerIcon />
    </IconWrapper>
  ),
  DATE_PICKER_WIDGET2: (props: IconProps) => (
    <IconWrapper {...props}>
      <DatePickerIcon />
    </IconWrapper>
  ),
  TABLE_WIDGET: (props: IconProps) => (
    <IconWrapper {...props}>
      <TableIcon />
    </IconWrapper>
  ),
  VIDEO_WIDGET: (props: IconProps) => (
    <IconWrapper {...props}>
      <VideoIcon />
    </IconWrapper>
  ),
  DROP_DOWN_WIDGET: (props: IconProps) => (
    <IconWrapper {...props}>
      <DropDownIcon />
    </IconWrapper>
  ),
  MULTI_SELECT_WIDGET: (props: IconProps) => (
    <IconWrapper {...props}>
      <MultiSelectIcon />
    </IconWrapper>
  ),
  RADIO_GROUP_WIDGET: (props: IconProps) => (
    <IconWrapper {...props}>
      <RadioGroupIcon />
    </IconWrapper>
  ),
  INPUT_WIDGET: (props: IconProps) => (
    <IconWrapper {...props}>
      <InputIcon />
    </IconWrapper>
  ),
  RICH_TEXT_EDITOR_WIDGET: (props: IconProps) => (
    <IconWrapper {...props}>
      <RichTextEditorIcon />
    </IconWrapper>
  ),
  SWITCH_WIDGET: (props: IconProps) => (
    <IconWrapper {...props}>
      <SwitchIcon />
    </IconWrapper>
  ),
  TEXT_WIDGET: (props: IconProps) => (
    <IconWrapper {...props}>
      <TextIcon />
    </IconWrapper>
  ),
  IMAGE_WIDGET: (props: IconProps) => (
    <IconWrapper {...props}>
      <ImageIcon />
    </IconWrapper>
  ),
  FILE_PICKER_WIDGET: (props: IconProps) => (
    <IconWrapper {...props}>
      <FilePickerIcon />
    </IconWrapper>
  ),
  TABS_WIDGET: (props: IconProps) => (
    <IconWrapper {...props}>
      <TabsIcon />
    </IconWrapper>
  ),
  CHART_WIDGET: (props: IconProps) => (
    <IconWrapper {...props}>
      <ChartIcon />
    </IconWrapper>
  ),
  FORM_WIDGET: (props: IconProps) => (
    <IconWrapper {...props}>
      <FormIcon />
    </IconWrapper>
  ),
  MAP_WIDGET: (props: IconProps) => (
    <IconWrapper {...props}>
      <MapIcon />
    </IconWrapper>
  ),
  MODAL_WIDGET: (props: IconProps) => (
    <IconWrapper {...props}>
      <ModalIcon />
    </IconWrapper>
  ),
  FORM_BUTTON_WIDGET: (props: IconProps) => (
    <IconWrapper {...props}>
      <ButtonIcon />
    </IconWrapper>
  ),
  LIST_WIDGET: (props: IconProps) => (
    <IconWrapper {...props} data-testid="list-widget-icon">
      <ListIcon />
    </IconWrapper>
  ),
  RATE_WIDGET: (props: IconProps) => (
    <IconWrapper {...props}>
      <RatingIcon />
    </IconWrapper>
  ),
  IFRAME_WIDGET: (props: IconProps) => (
    <IconWrapper {...props}>
      <EmbedIcon />
    </IconWrapper>
  ),
  DIVIDER_WIDGET: (props: IconProps) => (
    <IconWrapper {...props}>
      <DividerIcon />
    </IconWrapper>
  ),
  MENU_BUTTON_WIDGET: (props: IconProps) => (
    <IconWrapper {...props}>
      <MenuButtonIcon />
    </IconWrapper>
  ),
  ICON_BUTTON_WIDGET: (props: IconProps) => (
    <IconWrapper {...props}>
      <IconButtonIcon />
    </IconWrapper>
  ),
  RECORDER_WIDGET: (props: IconProps) => (
    <IconWrapper {...props}>
      <RecorderIcon />
    </IconWrapper>
  ),
};

export type WidgetIcon = typeof WidgetIcons[keyof typeof WidgetIcons];
