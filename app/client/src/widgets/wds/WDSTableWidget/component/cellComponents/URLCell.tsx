import React, { memo } from "react";
import { Link } from "@design-system/widgets";

import type {
  BaseCellComponentProps,
  CellLayoutProperties,
} from "../Constants";

export interface NumberCellProps {
  href?: string;
  text?: string;
  cellColor?: CellLayoutProperties["cellColor"];
  isBold?: boolean;
  isUnderline?: boolean;
  isItalic?: boolean;
}

function URLCell(props: NumberCellProps & BaseCellComponentProps) {
  const { allowCellWrapping, cellColor, href, isBold, isItalic, text } = props;
  const lineClamp = allowCellWrapping ? undefined : 1;

  return (
    <Link
      color={cellColor === "default" ? undefined : cellColor}
      href={href}
      isBold={isBold}
      isItalic={isItalic}
      lineClamp={lineClamp}
      title={text}
      variant="body"
    >
      {text}
    </Link>
  );
}

const MemoizedURLCell = memo(URLCell);

export { MemoizedURLCell as URLCell };
