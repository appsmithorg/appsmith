import React from "react";
import type { AnvilHighlightInfo } from "layoutSystems/anvil/utils/anvilTypes";
import { FlexLayerAlignment } from "layoutSystems/common/utils/constants";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import styled from "styled-components";
import { Popover, PopoverModalContent } from "@appsmith/wds-headless";
import { DropModalHereMessage } from "layoutSystems/anvil/common/messages";
import styles from "./styles.module.css";
import type { AnvilGlobalDnDStates } from "../canvas/hooks/useAnvilGlobalDnDStates";
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
  edgeDetails: {
    bottom: false,
    left: false,
    right: false,
    top: false,
  },
};

const DetachedWidgetsDropArenaWrapper = styled.span`
  /* purpose of this wrapper is to capture the mouse up event which is triggered anywhere on the modal */
  /* adding this style to make sure gap of layouts is not applied to the wrapper */
  position: absolute;
`;

export const DetachedWidgetsDropArena = (props: {
  anvilGlobalDragStates: AnvilGlobalDnDStates;
  onDrop: (renderedBlock: AnvilHighlightInfo) => void;
}) => {
  const onMouseUp = () => {
    props.onDrop({
      ...overlayWidgetHighlight,
      layoutOrder: [props.anvilGlobalDragStates.mainCanvasLayoutId],
    });
  };

  return props.anvilGlobalDragStates.activateOverlayWidgetDrop ? (
    <DetachedWidgetsDropArenaWrapper
      data-testid="t--anvil-detached-widgets-drop-arena"
      onMouseUp={onMouseUp}
    >
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
