import React from "react";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import { AnvilWidgetComponent } from "../common/widgetComponent/AnvilWidgetComponent";
import { ModalOverlayLayer } from "layoutSystems/common/modalOverlay/ModalOverlayLayer";
import { Classes } from "@blueprintjs/core";

/**
 * AnvilEditorModalOnion
 *
 * Component that wraps the BaseWidget implementation of a Modal Widget with Editor specific wrappers
 * needed in Anvil.
 *
 * Editor specific wrappers are wrappers added to perform actions in the editor.
 * - AnvilWidgetComponent: provides layer to auto update dimensions based on content/ add skeleton widget on loading state
 * - ModalOverlayLayer: provides blueprint library overlay for the modal widget to be rendered.
 * - ModalResizableLayer: provides the resize handles required to set dimension for a modal widget.
 * - ClickContentToOpenPropPane: provides a way to open property pane on clicking on a modal widget content.
 *
 * @returns Enhanced Widget
 */
export const AnvilEditorModalOnion = (props: BaseWidgetProps): JSX.Element => {
  return (
    <AnvilWidgetComponent {...props}>
      <ModalOverlayLayer {...props} isEditMode>
        <div className={Classes.OVERLAY_CONTENT}>{props.children}</div>
      </ModalOverlayLayer>
    </AnvilWidgetComponent>
  );
};
