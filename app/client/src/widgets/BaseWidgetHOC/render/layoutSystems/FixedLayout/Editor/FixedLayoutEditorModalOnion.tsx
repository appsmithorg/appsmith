import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import React from "react";
import { ModalResizableLayer } from "../ResizableLayer";
import { WidgetNameLayer } from "widgets/BaseWidgetHOC/render/common/WidgetNameLayer";
import { ClickContentToOpenPropPane } from "utils/hooks/useClickToSelectWidget";
import { withModalOverlay } from "../../common/withModalOverlay";

export const FixedLayoutEditorModalOnion = withModalOverlay(
  (props: BaseWidgetProps) => {
    return (
      <ModalResizableLayer {...props}>
        <WidgetNameLayer {...props}>
          <ClickContentToOpenPropPane widgetId={props.widgetId}>
            {props.children}
          </ClickContentToOpenPropPane>
        </WidgetNameLayer>
      </ModalResizableLayer>
    );
  },
);
