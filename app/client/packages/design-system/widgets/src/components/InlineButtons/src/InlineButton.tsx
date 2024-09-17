import React, { forwardRef } from "react";
import { Button } from "@appsmith/wds";
import type { ButtonProps } from "@appsmith/wds";
import type { ListState } from "@react-stately/list";
import type { Node } from "@react-types/shared";
import type { ForwardedRef } from "react";

interface InlineButtonProps<T> extends ButtonProps {
  state: ListState<T>;
  item: Node<T>;
}

const _InlineButtonsButton = <T extends object>(
  props: InlineButtonProps<T>,
  ref: ForwardedRef<HTMLButtonElement>,
) => {
  const { color, item, variant, ...rest } = props;

  return (
    <Button color={color} ref={ref} variant={variant} {...rest}>
      {item.rendered}
    </Button>
  );
};

export const InlineButton = forwardRef(_InlineButtonsButton);
