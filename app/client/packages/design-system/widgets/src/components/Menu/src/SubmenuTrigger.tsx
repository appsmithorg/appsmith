import React from "react";
import { SubmenuTrigger as AriaSubmenuTrigger } from "react-aria-components";
import type { SubmenuTriggerProps as AriaSubmenuTriggerProps } from "react-aria-components";

export function SubmenuTrigger(props: AriaSubmenuTriggerProps) {
  const { children, ...rest } = props;

  const modifiedChildren = React.Children.map(children, (child) => {
    if (
      React.isValidElement(child) &&
      typeof child.type === "function" &&
      "displayName" in child.type &&
      child.type.displayName === "MenuItem"
    ) {
      return React.cloneElement(child, {
        isSubMenuItem: true,
      } as React.ComponentProps<typeof child.type>);
    }

    return child;
  });

  return <AriaSubmenuTrigger {...rest}>{modifiedChildren}</AriaSubmenuTrigger>;
}
