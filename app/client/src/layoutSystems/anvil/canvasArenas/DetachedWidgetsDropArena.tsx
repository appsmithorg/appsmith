import { Modal, ModalContent } from "@design-system/widgets";
import React from "react";
import type { AnvilDnDStates } from "./hooks/useAnvilDnDStates";
import type { AnvilHighlightInfo } from "../utils/anvilTypes";
import { FlexLayerAlignment } from "layoutSystems/common/utils/constants";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import "./styles.css";

/**
 * Default highlight passed for AnvilOverlayWidgetTypes widgets
 */
const overlayWidgetHighlight: AnvilHighlightInfo = {
  layoutId: "",
  alignment: FlexLayerAlignment.Center,
  canvasId: MAIN_CONTAINER_WIDGET_ID,
  height: 0,
  isVertical: false,
  layoutOrder: [],
  posX: 0,
  posY: 0,
  rowIndex: 0,
  width: 0,
};

export const DetachedWidgetsDropArena = (props: {
  anvilDragStates: AnvilDnDStates;
  onDrop: (renderedBlock: AnvilHighlightInfo) => void;
}) => {
  const onMouseUp = () => {
    props.onDrop({
      ...overlayWidgetHighlight,
      layoutOrder: [props.anvilDragStates.mainCanvasLayoutId],
    });
  };
  return props.anvilDragStates.activateOverlayWidgetDrop ? (
    <span onMouseUp={onMouseUp}>
      <Modal
        isOpen={props.anvilDragStates.activateOverlayWidgetDrop}
        overlayClassName="detached-widgets-drop-overlay"
        size="large"
      >
        <ModalContent className="detached-widgets-drop-overlay-content">
          <div>Drop the Modal here</div>
        </ModalContent>
      </Modal>
    </span>
  ) : null;
};
