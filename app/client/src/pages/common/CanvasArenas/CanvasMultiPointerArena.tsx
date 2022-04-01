import React, { useEffect } from "react";
import styled from "styled-components";
import { Colors } from "constants/Colors";
import { useRef } from "react";
import store from "store";
import { useDispatch, useSelector } from "react-redux";
import {
  collabResetEditorsPointersData,
  collabStartSharingPointerEvent,
  collabStopSharingPointerEvent,
} from "actions/appCollabActions";
import { getIsPageLevelSocketConnected } from "selectors/websocketSelectors";
import { getCurrentGitBranch } from "selectors/gitSyncSelectors";
import { getPageLevelSocketRoomId } from "sagas/WebsocketSagas/utils";

export const POINTERS_CANVAS_ID = "collab-pointer-sharing-canvas";

const POINTER_COLORS = [
  Colors.JAFFA,
  Colors.SLATE_GRAY,
  Colors.DANUBE,
  Colors.JUNGLE_GREEN,
  Colors.JAFFA_DARK,
  Colors.PURPLE,
  Colors.BUTTER_CUP,
];
const COLOR_COUNT = 7;
const POINTER_MARGIN = 12;
const POINTER_PADDING_X = 15;
const POINTER_PADDING_Y = 5;
const TEXT_PADDING = 5;
const TWO_MINS = 120000; // in ms

const Canvas = styled.canvas`
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  overflow-y: auto;
  z-index: 1;
  pointer-events: none;
`;

const drawMousePointer = (
  idx: number,
  ctx: any,
  x: number,
  y: number,
  width: number,
  height = 22,
  radius = 2,
) => {
  if (width < 2 * radius) radius = width / 2;
  if (height < 2 * radius) radius = height / 2;
  ctx.fillStyle = POINTER_COLORS[idx % COLOR_COUNT];
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + POINTER_PADDING_X, y + POINTER_PADDING_Y);
  ctx.lineTo(x + POINTER_PADDING_Y, y + POINTER_PADDING_X);
  ctx.fill();
  x = x + POINTER_MARGIN;
  y = y + POINTER_MARGIN;
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
  ctx.fill();
};

// This maps the `socketId` to pointerEventData for all concurrent users.
type PointerDataType = {
  [s: string]: any;
};

function CanvasMultiPointerArena({ pageId }: { pageId: string }) {
  const dispatch = useDispatch();
  const animationStepIdRef = useRef<number>(0);
  const isWebsocketConnected = useSelector(getIsPageLevelSocketConnected);
  const currentGitBranch = useSelector(getCurrentGitBranch);
  let selectionCanvas: any;

  // Setup for painting on canvas
  useEffect(() => {
    selectionCanvas = document.getElementById(POINTERS_CANVAS_ID);

    animationStepIdRef.current = window.requestAnimationFrame(drawPointers);
    const clearPointerDataInterval = setInterval(() => {
      dispatch(collabResetEditorsPointersData());
    }, TWO_MINS);
    return () => {
      window.cancelAnimationFrame(animationStepIdRef.current);
      clearInterval(clearPointerDataInterval);
    };
  }, []);

  // Initialize the page editing events to share pointer.
  useEffect(() => {
    if (isWebsocketConnected) {
      dispatch(
        collabStartSharingPointerEvent(
          getPageLevelSocketRoomId(pageId, currentGitBranch),
        ),
      );
    }
    return () => {
      dispatch(
        collabStopSharingPointerEvent(
          getPageLevelSocketRoomId(pageId, currentGitBranch),
        ),
      );
    };
  }, [isWebsocketConnected, pageId, currentGitBranch]);

  const previousAnimationStep = useRef<number>();

  const drawPointers = (animationStep: number) => {
    const pointerData: PointerDataType = store.getState().ui.appCollab
      .pointerData;
    if (previousAnimationStep.current === animationStep) return;
    const ctx = selectionCanvas.getContext("2d");
    const rect = selectionCanvas.getBoundingClientRect();
    if (!!selectionCanvas) {
      selectionCanvas.width = rect.width;
      selectionCanvas.height = rect.height;
    }
    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.font = "14px Verdana";
    Object.keys(pointerData).forEach((socId: string, idx: number) => {
      const eventData = pointerData[socId];
      const userName = eventData?.user?.name || eventData?.user?.email;
      drawMousePointer(
        idx,
        ctx,
        eventData.data.x,
        eventData.data.y,
        ctx.measureText(userName).width + 2 * TEXT_PADDING,
      );
      ctx.fillStyle = Colors.BLACK;
      ctx.fillText(
        `${userName}`,
        eventData.data.x + POINTER_MARGIN + TEXT_PADDING,
        eventData.data.y + POINTER_MARGIN + POINTER_PADDING_X,
      );
    });
    previousAnimationStep.current = animationStep;
    animationStepIdRef.current = window.requestAnimationFrame(drawPointers);
  };

  return <Canvas id={POINTERS_CANVAS_ID} />;
}

export default CanvasMultiPointerArena;
