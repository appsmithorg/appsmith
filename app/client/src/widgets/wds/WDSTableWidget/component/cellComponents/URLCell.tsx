import React, { memo } from "react";
import type { COLORS } from "@design-system/widgets";
import { Link } from "@design-system/widgets";

import type { BaseCellComponentProps } from "../Constants";

export interface NumberCellProps {
  href?: string;
  text?: string;
  cellColor?: keyof typeof COLORS;
}

function URLCell(props: NumberCellProps & BaseCellComponentProps) {
  const { allowCellWrapping, cellColor, href, text } = props;
  const lineClamp = allowCellWrapping ? undefined : 1;

  return (
    <Link color={cellColor} href={href} lineClamp={lineClamp} variant="body">
      {text}
    </Link>
  );
}

const MemoizedURLCell = memo(URLCell);

export { MemoizedURLCell as URLCell };
