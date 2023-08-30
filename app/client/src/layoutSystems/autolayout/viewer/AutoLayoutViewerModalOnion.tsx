import { Classes } from "@blueprintjs/core";
import React from "react";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import { ModalOverlayLayer } from "../../common/ModalOverlayLayer";
import { AutoLayoutWidgetComponent } from "../common/widgetComponent/AutoLayoutWidgetComponent";

export const AutoLayoutViewerModalOnion = (props: BaseWidgetProps) => {
  return (
    <AutoLayoutWidgetComponent {...props}>
      <ModalOverlayLayer {...props} isEditMode={false}>
        <div className={Classes.OVERLAY_CONTENT}>{props.children}</div>
      </ModalOverlayLayer>
    </AutoLayoutWidgetComponent>
  );
};
