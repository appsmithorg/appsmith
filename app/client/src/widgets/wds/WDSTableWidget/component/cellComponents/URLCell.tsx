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
  const { allowCellWrapping, href, isBold, isItalic, text } = props;
  const lineClamp = allowCellWrapping ? undefined : 1;

  return (
    <Link
      href={href}
      isBold={isBold}
      isItalic={isItalic}
      lineClamp={lineClamp}
      size="body"
      title={text}
    >
      {text}
    </Link>
  );
}

const MemoizedURLCell = memo(URLCell);

export { MemoizedURLCell as URLCell };
