import React from "react";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import { AnvilWidgetComponent } from "../common/widgetComponent/AnvilWidgetComponent";
import { ModalOverlayLayer } from "layoutSystems/common/modalOverlay/ModalOverlayLayer";
import { ClickContentToOpenPropPane } from "utils/hooks/useClickToSelectWidget";
import { ModalResizableLayer } from "layoutSystems/common/resizer/ModalResizableLayer";

export const AnvilEditorModalOnion = (props: BaseWidgetProps) => {
  return (
    <AnvilWidgetComponent {...props}>
      <ModalOverlayLayer {...props} isEditMode>
        <ModalResizableLayer {...props}>
          <ClickContentToOpenPropPane widgetId={props.widgetId}>
            {props.children}
          </ClickContentToOpenPropPane>
        </ModalResizableLayer>
      </ModalOverlayLayer>
    </AnvilWidgetComponent>
  );
};
