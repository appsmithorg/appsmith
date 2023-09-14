import React from "react";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import { ModalOverlayLayer } from "../../common/modalOverlay/ModalOverlayLayer";
import { FixedLayoutWidgetComponent } from "../common/widgetComponent/FixedLayoutWidgetComponent";
import { Classes } from "@blueprintjs/core";

/**
 * FixedLayoutViewerModalOnion
 *
 * Component that wraps the BaseWidget implementation of a Modal Widget with Viewer specific wrappers
 * needed in Fixed Layout.
 *
 * Viewer specific wrappers are wrappers added to perform actions in the viewer.
 * - FixedLayoutWidgetComponent: provides layer to auto update height based on content/ add skeleton widget on loading state.
 * - ModalOverlayLayer: provides blueprint library overlay for the modal widget to be rendered.
 *
 * @returns Enhanced Modal Widget
 */

export const FixedLayoutViewerModalOnion = (props: BaseWidgetProps) => {
  return (
    <FixedLayoutWidgetComponent {...props}>
      <ModalOverlayLayer {...props} isEditMode={false}>
        <div className={Classes.OVERLAY_CONTENT}>{props.children}</div>
      </ModalOverlayLayer>
    </FixedLayoutWidgetComponent>
  );
};
