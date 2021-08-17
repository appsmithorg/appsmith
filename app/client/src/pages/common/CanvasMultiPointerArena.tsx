import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { Socket } from "socket.io-client";
import { Colors } from "constants/Colors";
import { APP_COLLAB_EVENTS } from "constants/AppCollabConstants";
import { useRef } from "react";

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
const PX_PER_CHAR = 8.67;
const TWO_MINS = 120000; // in ms

const Canvas = styled.canvas`
  position: absolute;
  top: 0;
  left: 0;
  height: calc(100% + ${(props) => props.theme.canvasBottomPadding}px);
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
  height = 24,
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

type PointerEventDataType = {
  data: { x: number; y: number };
  socketId: string;
  user: any;
};

function CanvasMultiPointerArena({
  pageEditSocket,
  pageId,
}: {
  pageEditSocket: Socket;
  pageId: string;
}) {
  let pointerData: PointerDataType = {};
  const animationStepIdRef = useRef<number>(0);
  const [isPageEditSocketConnected, setIsPageEditSocketConnected] = useState<
    boolean
  >(pageEditSocket.connected);
  let selectionCanvas: any;

  // Setup for painting on canvas
  useEffect(() => {
    selectionCanvas = document.getElementById(POINTERS_CANVAS_ID);

    animationStepIdRef.current = window.requestAnimationFrame(drawPointers);
    const clearPointerDataInterval = setInterval(() => {
      pointerData = {};
    }, TWO_MINS);
    return () => {
      window.cancelAnimationFrame(animationStepIdRef.current);
      clearInterval(clearPointerDataInterval);
    };
  }, []);

  // Initialize the page editing events to share pointer.
  useEffect(() => {
    if (isPageEditSocketConnected) {
      pageEditSocket.emit(APP_COLLAB_EVENTS.START_EDITING_APP, pageId);
    } else {
      pageEditSocket.connect(); // try to connect manually
    }
    return () => {
      pageEditSocket.emit(APP_COLLAB_EVENTS.STOP_EDITING_APP);
    };
  }, [isPageEditSocketConnected, pageId]);

  // Subscribe to RTS events
  useEffect(() => {
    pageEditSocket.on(APP_COLLAB_EVENTS.CONNECT, () => {
      setIsPageEditSocketConnected(true);
    });
    pageEditSocket.on(APP_COLLAB_EVENTS.DISCONNECT, () => {
      setIsPageEditSocketConnected(false);
    });
    pageEditSocket.on(
      APP_COLLAB_EVENTS.SHARE_USER_POINTER,
      (eventData: PointerEventDataType) => {
        if (
          eventData &&
          selectionCanvas &&
          pageEditSocket.id !== eventData.socketId
        ) {
          pointerData[eventData.socketId] = eventData;
        }
      },
    );

    pageEditSocket.on(
      APP_COLLAB_EVENTS.STOP_EDITING_APP,
      (socketId: string) => {
        // hide pointer of users that leave the page
        delete pointerData[socketId];
      },
    );

    return () => {
      pageEditSocket.disconnect();
    };
  }, []);

  const previousAnimationStep = useRef<number>();

  const drawPointers = (animationStep: number) => {
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
        userName.length * PX_PER_CHAR * 1.054 || 0,
      );
      ctx.fillStyle = Colors.BLACK;
      ctx.fillText(
        `${userName}`,
        eventData.data.x + POINTER_MARGIN + POINTER_PADDING_Y,
        eventData.data.y + POINTER_MARGIN + POINTER_PADDING_X,
      );
    });
    previousAnimationStep.current = animationStep;
    animationStepIdRef.current = window.requestAnimationFrame(drawPointers);
  };

  return <Canvas id={POINTERS_CANVAS_ID} />;
}

export default CanvasMultiPointerArena;
