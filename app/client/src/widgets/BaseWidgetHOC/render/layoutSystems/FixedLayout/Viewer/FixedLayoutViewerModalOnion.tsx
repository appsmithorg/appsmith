import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import { withModalOverlay } from "../../common/withModalOverlay";

export const FixedLayoutViewerModalOnion = withModalOverlay(
  (props: BaseWidgetProps) => {
    return props.children;
  },
);
