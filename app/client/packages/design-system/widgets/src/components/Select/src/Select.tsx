import { getTypographyClassName } from "@design-system/theming";
import React, { useRef } from "react";
import { popoverStyles } from "../../../styles";
import type {
  SelectProps as SpectrumSelectProps,
  ListBoxItemProps as SpectrumListBoxItemProps,
} from "react-aria-components";
import {
  Button,
  Label,
  ListBox,
  Popover,
  Select as SpectrumSelect,
  SelectValue,
  ListBoxItem as SpectrumListBoxItem,
} from "react-aria-components";
import type { IconProps } from "@design-system/widgets";
import { Text, Icon } from "@design-system/widgets";
import clsx from "clsx";

interface SelectProps<T extends object> extends SpectrumSelectProps<T> {
  items: Iterable<{ name: string; key: number; iconName?: IconProps["name"] }>;
  label?: string;
}

export const Select = <T extends object>(props: SelectProps<T>) => {
  const { items, label, ...rest } = props;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const root = triggerRef.current?.closest(
    "[data-theme-provider]",
  ) as HTMLButtonElement;

  return (
    <SpectrumSelect {...rest} className={popoverStyles.formField}>
      <Label>
        <Text fontWeight={600} variant="caption">
          {label}
        </Text>
      </Label>
      <Button className={clsx(popoverStyles.textField)} ref={triggerRef}>
        <SelectValue
          className={getTypographyClassName("body")}
          data-select-value=""
        />
        <Icon name="chevron-down" />
      </Button>
      <Popover UNSTABLE_portalContainer={root}>
        <ListBox className={popoverStyles.popover} items={items}>
          {(item) => (
            <ListBoxItem iconName={item.iconName} key={item.key}>
              {item.name}
            </ListBoxItem>
          )}
        </ListBox>
      </Popover>
    </SpectrumSelect>
  );
};

interface ListBoxItemProps extends SpectrumListBoxItemProps {
  /** Icon to be used in the button of the button */
  iconName?: IconProps["name"];
}

export const ListBoxItem = (props: ListBoxItemProps) => {
  const { children, iconName } = props;
  return (
    <SpectrumListBoxItem {...props} className={popoverStyles.popoverListItem}>
      {iconName && <Icon name={iconName} />}
      {children}
    </SpectrumListBoxItem>
  );
};
