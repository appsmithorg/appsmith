import { Classes } from "@blueprintjs/core";
import React from "react";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import { ModalOverlayLayer } from "../../common/modalOverlay/ModalOverlayLayer";
import { AutoLayoutWidgetComponent } from "../common/widgetComponent/AutoLayoutWidgetComponent";

/**
 * AutoLayoutViewerModalOnion
 *
 * Component that wraps the BaseWidget implementation of a Modal Widget with Viewer(Deployed Application Viewer) specific wrappers
 * needed in Auto Layout.
 *
 * Viewer specific wrappers are wrappers added to perform actions in the viewer.
 * - AutoLayoutWidgetComponent: provides layer to auto update dimensions based on content/ add skeleton widget on loading state
 * - ModalOverlayLayer: provides blueprint library overlay for the modal widget to be rendered.
 *
 * @returns Enhanced Widget
 */

export const AutoLayoutViewerModalOnion = (props: BaseWidgetProps) => {
  return (
    <AutoLayoutWidgetComponent {...props}>
      <ModalOverlayLayer {...props} isEditMode={false}>
        <div className={Classes.OVERLAY_CONTENT}>{props.children}</div>
      </ModalOverlayLayer>
    </AutoLayoutWidgetComponent>
  );
};
