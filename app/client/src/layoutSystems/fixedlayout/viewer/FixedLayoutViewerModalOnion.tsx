import React from "react";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import { ModalOverlayLayer } from "../../common/modalOverlay/ModalOverlayLayer";
import { FixedLayoutWigdetComponent } from "../common/FixedLayoutWidgetComponent";
import { Classes } from "@blueprintjs/core";

export const FixedLayoutViewerModalOnion = (props: BaseWidgetProps) => {
  return (
    <FixedLayoutWigdetComponent {...props}>
      <ModalOverlayLayer {...props} isEditMode={false}>
        <div className={Classes.OVERLAY_CONTENT}>{props.children}</div>
      </ModalOverlayLayer>
    </FixedLayoutWigdetComponent>
  );
};
