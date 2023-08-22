import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import { withModalOverlay } from "../../common/withModalOverlay";

export const AutoLayoutViewerModalOnion = withModalOverlay(
  (props: BaseWidgetProps) => {
    return props.children;
  },
);
