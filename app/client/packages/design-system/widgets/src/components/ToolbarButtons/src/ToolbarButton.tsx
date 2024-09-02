import React, { forwardRef } from "react";
import { Button } from "@appsmith/wds";
import type { ButtonProps } from "@appsmith/wds";
import type { ForwardedRef } from "react";
import type { ListState } from "@react-stately/list";
import type { Node } from "@react-types/shared";

interface ToolbarButtonProps<T> extends ButtonProps {
  state: ListState<T>;
  item: Node<T>;
}

const _ToolbarButton = <T extends object>(
  props: ToolbarButtonProps<T>,
  ref: ForwardedRef<HTMLButtonElement>,
) => {
  const { color, item, variant, ...rest } = props;

  return (
    <Button color={color} ref={ref} variant={variant} {...rest}>
      {item.rendered}
    </Button>
  );
};

export const ToolbarButton = forwardRef(_ToolbarButton);
