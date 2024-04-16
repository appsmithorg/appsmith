import React from "react";
import type { AnvilDnDStates } from "./hooks/useAnvilDnDStates";
import type { AnvilHighlightInfo } from "layoutSystems/anvil/utils/anvilTypes";
import { FlexLayerAlignment } from "layoutSystems/common/utils/constants";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import styled from "styled-components";
import { Popover, PopoverModalContent } from "@design-system/headless";
import { DropModalHereMessage } from "layoutSystems/anvil/common/messages";
import styles from "./styles.module.css";
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

const DetachedWidgetsDropArenaWrapper = styled.span`
  /* purpose of this wrapper is to capture the mouse up event which is triggered anywhere on the modal */
  /* adding this style to make sure gap of layouts is not applied to the wrapper */
  position: absolute;
`;

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
    <DetachedWidgetsDropArenaWrapper onMouseUp={onMouseUp}>
      <Popover isOpen modal>
        <PopoverModalContent
          contentClassName={styles.detachedWidgetsDropOverlayContent}
          overlayClassName={styles.detachedWidgetsDropOverlay}
        >
          {DropModalHereMessage()}
        </PopoverModalContent>
      </Popover>
    </DetachedWidgetsDropArenaWrapper>
  ) : null;
};
