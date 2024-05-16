import React, { memo } from "react";
import type { COLORS } from "@design-system/widgets";
import { Text } from "@design-system/widgets";

import type { BaseCellComponentProps } from "../Constants";

export interface PlainTextCellProps {
  value: any;
  cellColor?: "default" | keyof typeof COLORS;
  isBold?: boolean;
  isUnderline?: boolean;
  isItalic?: boolean;
}

function PlainTextCell(props: PlainTextCellProps & BaseCellComponentProps) {
  const { allowCellWrapping, cellColor, isBold, isItalic, value } = props;
  const lineClamp = allowCellWrapping ? undefined : 1;

  return (
    <Text
      color={cellColor === "default" ? undefined : cellColor}
      isBold={isBold}
      isItalic={isItalic}
      lineClamp={lineClamp}
      size="body"
      title={value}
    >
      {value}
    </Text>
  );
}

const MemoizedPlainText = memo(PlainTextCell);

export { MemoizedPlainText as PlainTextCell };
