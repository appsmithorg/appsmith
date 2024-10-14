import React, { memo, useState } from "react";
import type { ButtonProps, COLORS } from "@appsmith/wds";
import { Button } from "@appsmith/wds";

import type { BaseCellComponentProps } from "../Constants";

export interface ButtonCellProps {
  buttonLabel?: string;
  buttonColor?: keyof typeof COLORS;
  buttonVariant?: ButtonProps["variant"];
  onClick?: (onComplete: () => void) => void;
  isDisabled?: boolean;
  excludeFromTabOrder?: boolean;
}

function ButtonCell(props: ButtonCellProps & BaseCellComponentProps) {
  const {
    buttonColor = "accent",
    buttonLabel,
    buttonVariant,
    excludeFromTabOrder,
    isDisabled,
  } = props;
  const [isLoading, setIsLoading] = useState(false);

  const onComplete = () => {
    setIsLoading(false);
  };

  const onClick = () => {
    setIsLoading(true);

    if (props.onClick) {
      props.onClick(onComplete);
    }
  };

  return (
    <Button
      color={buttonColor}
      excludeFromTabOrder={excludeFromTabOrder}
      isDisabled={isDisabled}
      isLoading={isLoading}
      onPress={onClick}
      variant={buttonVariant}
    >
      {buttonLabel}
    </Button>
  );
}

const MemoizedButtonCell = memo(ButtonCell);

export { MemoizedButtonCell as ButtonCell };
