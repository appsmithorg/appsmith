import React from "react";
import { IconProps, IconWrapper } from "../constants/IconConstants";
import { ReactComponent as SpinnerIcon } from "../assets/icons/widget/alert.svg";
import { ReactComponent as ButtonIcon } from "../assets/icons/widget/button.svg";
import { ReactComponent as CollapseIcon } from "../assets/icons/widget/collapse.svg";
import { ReactComponent as ContainerIcon } from "../assets/icons/widget/container.svg";
import { ReactComponent as DatePickerIcon } from "../assets/icons/widget/datepicker.svg";
import { ReactComponent as TableIcon } from "../assets/icons/widget/table.svg";
import { ReactComponent as DropDownIcon } from "../assets/icons/widget/dropdown.svg";
import { ReactComponent as CheckboxIcon } from "../assets/icons/widget/checkbox.svg";
import { ReactComponent as RadioGroupIcon } from "../assets/icons/widget/radio.svg";
import { ReactComponent as InputIcon } from "../assets/icons/widget/input.svg";
import { ReactComponent as SwitchIcon } from "../assets/icons/widget/switch.svg";
import { ReactComponent as TextIcon } from "../assets/icons/widget/text.svg";

/* eslint-disable react/display-name */

export const WidgetIcons: {
  [id: string]: Function;
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
  DATE_PICKER_WIDGET: (props: IconProps) => (
    <IconWrapper {...props}>
      <DatePickerIcon />
    </IconWrapper>
  ),
  TABLE_WIDGET: (props: IconProps) => (
    <IconWrapper {...props}>
      <TableIcon />
    </IconWrapper>
  ),
  DROP_DOWN_WIDGET: (props: IconProps) => (
    <IconWrapper {...props}>
      <DropDownIcon />
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
};

export type WidgetIcon = (typeof WidgetIcons)[keyof typeof WidgetIcons];
