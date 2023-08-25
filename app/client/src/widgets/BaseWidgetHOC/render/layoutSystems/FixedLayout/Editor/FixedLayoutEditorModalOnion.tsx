import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import React from "react";
import { WidgetNameLayer } from "widgets/BaseWidgetHOC/render/common/WidgetNameLayer";
import { ClickContentToOpenPropPane } from "utils/hooks/useClickToSelectWidget";
import { ModalResizableLayer } from "../../common/ModalResizableLayer";
import { ModalOverlayLayer } from "../../common/ModalOverlayLayer";
import { FixedLayoutWigdetComponent } from "../common/FixedLayoutWidgetComponent";

export const FixedLayoutEditorModalOnion = (props: BaseWidgetProps) => {
  return (
    <FixedLayoutWigdetComponent {...props}>
      <ModalOverlayLayer {...props} isEditMode>
        <ModalResizableLayer {...props}>
          <WidgetNameLayer {...props}>
            <ClickContentToOpenPropPane widgetId={props.widgetId}>
              {props.children}
            </ClickContentToOpenPropPane>
          </WidgetNameLayer>
        </ModalResizableLayer>
      </ModalOverlayLayer>
    </FixedLayoutWigdetComponent>
  );
};
