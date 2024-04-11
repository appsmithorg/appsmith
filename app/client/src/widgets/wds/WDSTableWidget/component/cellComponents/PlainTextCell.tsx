import React, { memo } from "react";
import { COLORS, Text } from "@design-system/widgets";

import type { BaseCellComponentProps } from "../Constants";

export type PlainTextCellProps = {
  value: any;
  cellColor?: keyof typeof COLORS
};

function PlainTextCell(props: PlainTextCellProps & BaseCellComponentProps) {
  let { value, cellColor, allowCellWrapping } = props;
  const lineClamp = allowCellWrapping ? undefined : 1;

  return (
    <Text color={cellColor} variant="body" lineClamp={lineClamp}>{value}</Text>  
  );
}

const MemoizedPlainText =  memo(PlainTextCell);

export { MemoizedPlainText as PlainTextCell };
