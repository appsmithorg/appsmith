import React, { memo, useState } from "react";
import type { ButtonProps, COLORS } from "@design-system/widgets";
import { Button } from "@design-system/widgets";

import type { BaseCellComponentProps } from "../Constants";

export interface ButtonCellProps {
  buttonLabel?: string;
  cellColor?: "default" | keyof typeof COLORS;
  buttonVariant?: ButtonProps["variant"];
  onClick?: (onComplete: () => void) => void;
  isDisabled?: boolean;
}

function ButtonCell(props: ButtonCellProps & BaseCellComponentProps) {
  const { buttonLabel, buttonVariant, cellColor, isDisabled } = props;
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
      color={cellColor === "default" ? "accent" : cellColor}
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
