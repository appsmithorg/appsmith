import React from "react";
import { Classes } from "@blueprintjs/core";

import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import { AnvilWidgetComponent } from "../common/widgetComponent/AnvilWidgetComponent";
import { ModalOverlayLayer } from "layoutSystems/common/modalOverlay/ModalOverlayLayer";

export const AnvilViewerModalOnion = (props: BaseWidgetProps) => {
  return (
    <AnvilWidgetComponent {...props}>
      <ModalOverlayLayer {...props} isEditMode={false}>
        <div className={Classes.OVERLAY_CONTENT}>{props.children}</div>
      </ModalOverlayLayer>
    </AnvilWidgetComponent>
  );
};
