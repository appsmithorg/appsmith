import React, { memo } from "react";
import { Link } from "@appsmith/wds";

import type { BaseCellComponentProps } from "../Constants";

export interface NumberCellProps {
  href?: string;
  text?: string;
  isBold?: boolean;
  isUnderline?: boolean;
  isItalic?: boolean;
}

function URLCell(props: NumberCellProps & BaseCellComponentProps) {
  const { href, isBold, isItalic, text } = props;

  return (
    <Link
      href={href}
      isBold={isBold}
      isItalic={isItalic}
      lineClamp={1}
      size="body"
      title={text}
    >
      {text}
    </Link>
  );
}

const MemoizedURLCell = memo(URLCell);

export { MemoizedURLCell as URLCell };
