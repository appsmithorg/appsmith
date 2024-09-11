import type { UseOverlayScrollbarsParams } from "overlayscrollbars-react";

import type { Sizes } from "../__config__/types";

// ScrollArea props
export interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: Extract<Sizes, "sm" | "md">;
  options?: UseOverlayScrollbarsParams["options"];
  events?: UseOverlayScrollbarsParams["events"];
  defer?: UseOverlayScrollbarsParams["defer"];
}
