import React, { JSXElementConstructor } from "react";
import styled from "styled-components";

import { Colors } from "constants/Colors";
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
import { ReactComponent as MultiSelectV2Icon } from "assets/icons/widget/multiselect.svg";
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
import { ReactComponent as ButtonGroupIcon } from "assets/icons/widget/button-group.svg";
import { ReactComponent as ProgressBarIcon } from "assets/icons/widget/progressbar-icon.svg";
import { ReactComponent as SwitchGroupIcon } from "assets/icons/widget/switch-group.svg";
import { ReactComponent as CameraIcon } from "assets/icons/widget/camera.svg";
import { ReactComponent as MapChartIcon } from "assets/icons/widget/map-chart.svg";
import { ReactComponent as PhoneInput } from "assets/icons/widget/phoneInput.svg";
import { ReactComponent as CurrencyInput } from "assets/icons/widget/currencyInput.svg";
import { ReactComponent as CircularProgressIcon } from "assets/icons/widget/circular-progress.svg";

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
  SPINNER_WIDGET: (props: IconProps) => (
    <StyledIconWrapper {...props}>
      <SpinnerIcon />
    </StyledIconWrapper>
  ),
  BUTTON_WIDGET: (props: IconProps) => (
    <StyledIconWrapper {...props}>
      <ButtonIcon />
    </StyledIconWrapper>
  ),
  CHECKBOX_WIDGET: (props: IconProps) => (
    <StyledIconWrapper {...props}>
      <CheckboxIcon />
    </StyledIconWrapper>
  ),
  COLLAPSE_WIDGET: (props: IconProps) => (
    <StyledIconWrapper {...props}>
      <CollapseIcon />
    </StyledIconWrapper>
  ),
  CONTAINER_WIDGET: (props: IconProps) => (
    <StyledIconWrapper {...props}>
      <ContainerIcon />
    </StyledIconWrapper>
  ),
  DATE_PICKER_WIDGET2: (props: IconProps) => (
    <StyledIconWrapper {...props}>
      <DatePickerIcon />
    </StyledIconWrapper>
  ),
  TABLE_WIDGET: (props: IconProps) => (
    <StyledIconWrapper {...props}>
      <TableIcon />
    </StyledIconWrapper>
  ),
  VIDEO_WIDGET: (props: IconProps) => (
    <StyledIconWrapper {...props}>
      <VideoIcon />
    </StyledIconWrapper>
  ),
  DROP_DOWN_WIDGET: (props: IconProps) => (
    <StyledIconWrapper {...props}>
      <DropDownIcon />
    </StyledIconWrapper>
  ),
  MULTI_SELECT_WIDGET: (props: IconProps) => (
    <StyledIconWrapper {...props}>
      <MultiSelectIcon />
    </StyledIconWrapper>
  ),
  SELECT_WIDGET: (props: IconProps) => (
    <StyledIconWrapper {...props}>
      <DropDownIcon />
    </StyledIconWrapper>
  ),
  MULTI_SELECT_WIDGET_V2: (props: IconProps) => (
    <StyledIconWrapper {...props}>
      <MultiSelectV2Icon />
    </StyledIconWrapper>
  ),
  RADIO_GROUP_WIDGET: (props: IconProps) => (
    <StyledIconWrapper {...props}>
      <RadioGroupIcon />
    </StyledIconWrapper>
  ),
  INPUT_WIDGET: (props: IconProps) => (
    <StyledIconWrapper {...props}>
      <InputIcon />
    </StyledIconWrapper>
  ),
  INPUT_WIDGET_V2: (props: IconProps) => (
    <StyledIconWrapper {...props}>
      <InputIcon />
    </StyledIconWrapper>
  ),
  RICH_TEXT_EDITOR_WIDGET: (props: IconProps) => (
    <StyledIconWrapper {...props}>
      <RichTextEditorIcon />
    </StyledIconWrapper>
  ),
  SWITCH_WIDGET: (props: IconProps) => (
    <StyledIconWrapper {...props}>
      <SwitchIcon />
    </StyledIconWrapper>
  ),
  TEXT_WIDGET: (props: IconProps) => (
    <StyledIconWrapper {...props}>
      <TextIcon />
    </StyledIconWrapper>
  ),
  IMAGE_WIDGET: (props: IconProps) => (
    <StyledIconWrapper {...props}>
      <ImageIcon />
    </StyledIconWrapper>
  ),
  FILE_PICKER_WIDGET_V2: (props: IconProps) => (
    <StyledIconWrapper {...props}>
      <FilePickerIcon />
    </StyledIconWrapper>
  ),
  TABS_WIDGET: (props: IconProps) => (
    <StyledIconWrapper {...props}>
      <TabsIcon />
    </StyledIconWrapper>
  ),
  CHART_WIDGET: (props: IconProps) => (
    <StyledIconWrapper {...props}>
      <ChartIcon />
    </StyledIconWrapper>
  ),
  FORM_WIDGET: (props: IconProps) => (
    <StyledIconWrapper {...props}>
      <FormIcon />
    </StyledIconWrapper>
  ),
  MAP_WIDGET: (props: IconProps) => (
    <StyledIconWrapper {...props}>
      <MapIcon />
    </StyledIconWrapper>
  ),
  MODAL_WIDGET: (props: IconProps) => (
    <StyledIconWrapper {...props}>
      <ModalIcon />
    </StyledIconWrapper>
  ),
  FORM_BUTTON_WIDGET: (props: IconProps) => (
    <StyledIconWrapper {...props}>
      <ButtonIcon />
    </StyledIconWrapper>
  ),
  LIST_WIDGET: (props: IconProps) => (
    <StyledIconWrapper {...props} data-testid="list-widget-icon">
      <ListIcon />
    </StyledIconWrapper>
  ),
  RATE_WIDGET: (props: IconProps) => (
    <StyledIconWrapper {...props}>
      <RatingIcon />
    </StyledIconWrapper>
  ),
  IFRAME_WIDGET: (props: IconProps) => (
    <StyledIconWrapper {...props}>
      <EmbedIcon />
    </StyledIconWrapper>
  ),
  DIVIDER_WIDGET: (props: IconProps) => (
    <StyledIconWrapper {...props}>
      <DividerIcon />
    </StyledIconWrapper>
  ),
  MENU_BUTTON_WIDGET: (props: IconProps) => (
    <StyledIconWrapper {...props}>
      <MenuButtonIcon />
    </StyledIconWrapper>
  ),
  TREE_SINGLE_SELECT_WIDGET: (props: IconProps) => (
    <StyledIconWrapper {...props}>
      <SingleTreeSelectIcon />
    </StyledIconWrapper>
  ),
  TREE_MULTI_SELECT_WIDGET: (props: IconProps) => (
    <StyledIconWrapper {...props}>
      <MultiTreeSelectIcon />
    </StyledIconWrapper>
  ),
  ICON_BUTTON_WIDGET: (props: IconProps) => (
    <StyledIconWrapper {...props}>
      <IconButtonIcon />
    </StyledIconWrapper>
  ),
  STATBOX_WIDGET: (props: IconProps) => (
    <StyledIconWrapper {...props}>
      <StatboxIcon />
    </StyledIconWrapper>
  ),
  CHECKBOX_GROUP_WIDGET: (props: IconProps) => (
    <StyledIconWrapper {...props}>
      <CheckboxGroupIcon />
    </StyledIconWrapper>
  ),
  AUDIO_RECORDER_WIDGET: (props: IconProps) => (
    <StyledIconWrapper {...props}>
      <AudioRecorderIcon />
    </StyledIconWrapper>
  ),
  BUTTON_GROUP_WIDGET: (props: IconProps) => (
    <StyledIconWrapper {...props}>
      <ButtonGroupIcon />
    </StyledIconWrapper>
  ),
  PROGRESSBAR_WIDGET: (props: IconProps) => (
    <StyledIconWrapper {...props}>
      <ProgressBarIcon />
    </StyledIconWrapper>
  ),
  SWITCH_GROUP_WIDGET: (props: IconProps) => (
    <StyledIconWrapper {...props}>
      <SwitchGroupIcon />
    </StyledIconWrapper>
  ),
  CAMERA_WIDGET: (props: IconProps) => (
    <StyledIconWrapper {...props}>
      <CameraIcon />
    </StyledIconWrapper>
  ),
  MAP_CHART_WIDGET: (props: IconProps) => (
    <StyledIconWrapper {...props}>
      <MapChartIcon />
    </StyledIconWrapper>
  ),
  PHONE_INPUT_WIDGET: (props: IconProps) => (
    <StyledIconWrapper {...props}>
      <PhoneInput />
    </StyledIconWrapper>
  ),
  CURRENCY_INPUT_WIDGET: (props: IconProps) => (
    <StyledIconWrapper {...props}>
      <CurrencyInput />
    </StyledIconWrapper>
  ),
  CIRCULAR_PROGRESS_WIDGET: (props: IconProps) => (
    <StyledIconWrapper {...props}>
      <CircularProgressIcon />
    </StyledIconWrapper>
  ),
};

export type WidgetIcon = typeof WidgetIcons[keyof typeof WidgetIcons];
