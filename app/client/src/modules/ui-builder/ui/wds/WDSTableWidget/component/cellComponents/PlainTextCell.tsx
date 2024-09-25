import React, { memo } from "react";
import type { COLORS } from "@appsmith/wds";
import { Text } from "@appsmith/wds";

import type { BaseCellComponentProps } from "../Constants";

export interface PlainTextCellProps {
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
  cellColor?: "default" | keyof typeof COLORS;
  isBold?: boolean;
  isUnderline?: boolean;
  isItalic?: boolean;
}

function PlainTextCell(props: PlainTextCellProps & BaseCellComponentProps) {
  const { cellColor, isBold, isItalic, value } = props;

  return (
    <Text
      color={cellColor === "default" ? undefined : cellColor}
      isBold={isBold}
      isItalic={isItalic}
      lineClamp={1}
      size="body"
      title={value}
    >
      {value}
    </Text>
  );
}

const MemoizedPlainText = memo(PlainTextCell);

export { MemoizedPlainText as PlainTextCell };
