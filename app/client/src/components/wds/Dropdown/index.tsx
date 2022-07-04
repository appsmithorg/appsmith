import React, { useMemo, Ref, PropsWithChildren } from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";

export const DropdownMenu = DropdownMenuPrimitive.Root;

export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
export const DropdownMenuContent = React.forwardRef(
  (
    { children, ...props }: DropdownMenuPrimitive.DropdownMenuContentProps,
    forwardedRef?: Ref<HTMLDivElement>,
  ) => {
    return (
      <DropdownMenuPrimitive.Content
        className="bg-[color:var(--color-bg)] p-2 min-w-[220px] rounded-[var(--radius)] shadow-sm ring-1 ring-[color:var(--color-border)]  side-bottom:animate-slide-down-fade"
        ref={forwardedRef}
        sideOffset={6}
        {...props}
      >
        {children}
      </DropdownMenuPrimitive.Content>
    );
  },
);

export const DropdownMenuLabel = DropdownMenuPrimitive.Label;

export const DropdownMenuItem = (
  props: DropdownMenuPrimitive.DropdownMenuItemProps,
) => {
  const { children, ...rest } = props;
  return (
    <DropdownMenuPrimitive.Item
      className="flex py-1 px-2 cursor-pointer text-sm hover:outline-none focus:bg-gray-100 focus:outline-none rounded-[var(--radius-sm)]"
      {...rest}
    >
      {children}
    </DropdownMenuPrimitive.Item>
  );
};

export const DropdownMenuGroup = DropdownMenuPrimitive.Group;

export const DropdownMenuCheckboxItem = React.forwardRef(
  ({ children, ...props }, forwardedRef: Ref<HTMLDivElement>) => {
    return (
      <DropdownMenuPrimitive.CheckboxItem {...props} ref={forwardedRef}>
        {children}
        <DropdownMenuPrimitive.ItemIndicator>
          <p>Icon</p>
        </DropdownMenuPrimitive.ItemIndicator>
      </DropdownMenuPrimitive.CheckboxItem>
    );
  },
);

export const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

export const DropdownMenuRadioItem = React.forwardRef(
  (
    { children, ...props }: DropdownMenuPrimitive.DropdownMenuRadioItemProps,
    forwardedRef: Ref<HTMLDivElement>,
  ) => {
    return (
      <DropdownMenuPrimitive.RadioItem {...props} ref={forwardedRef}>
        {children}
        <DropdownMenuPrimitive.ItemIndicator>
          <p>Icon</p>
        </DropdownMenuPrimitive.ItemIndicator>
      </DropdownMenuPrimitive.RadioItem>
    );
  },
);

export const DropdownMenuSeparator = DropdownMenuPrimitive.Separator;
