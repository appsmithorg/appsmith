import React from "react";
import { Classes } from "@blueprintjs/core";

import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import { AnvilWidgetComponent } from "../common/widgetComponent/AnvilWidgetComponent";
import { ModalOverlayLayer } from "layoutSystems/common/modalOverlay/ModalOverlayLayer";

/**
 * AnvilViewerModalOnion
 *
 * Component that wraps the BaseWidget implementation of a Modal Widget with Viewer(Deployed Application Viewer) specific wrappers
 * needed in Anvil.
 *
 * Viewer specific wrappers are wrappers added to perform actions in the viewer.
 * - AnvilWidgetComponent: provides layer to auto update dimensions based on content/ add skeleton widget on loading state
 * - ModalOverlayLayer: provides blueprint library overlay for the modal widget to be rendered.
 *
 * @returns Enhanced Widget
 */
export const AnvilViewerModalOnion = (props: BaseWidgetProps) => {
  return (
    <AnvilWidgetComponent {...props}>
      <ModalOverlayLayer {...props} isEditMode={false}>
        <div className={Classes.OVERLAY_CONTENT}>{props.children}</div>
      </ModalOverlayLayer>
    </AnvilWidgetComponent>
  );
};
