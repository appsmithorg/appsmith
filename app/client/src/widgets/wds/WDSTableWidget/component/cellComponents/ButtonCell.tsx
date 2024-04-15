import React, { memo } from "react";
import type { ButtonProps, COLORS } from "@design-system/widgets";
import { Button } from "@design-system/widgets";

import type { BaseCellComponentProps } from "../Constants";

export interface ButtonCellProps {
  buttonLabel?: string;
  cellColor?: keyof typeof COLORS;
  buttonVariant?: ButtonProps["variant"];
}

function ButtonCell(props: ButtonCellProps & BaseCellComponentProps) {
  const { buttonLabel, buttonVariant } = props;

  return <Button variant={buttonVariant}>{buttonLabel}</Button>;
}

const MemoizedButtonCell = memo(ButtonCell);

export { MemoizedButtonCell as ButtonCell };
