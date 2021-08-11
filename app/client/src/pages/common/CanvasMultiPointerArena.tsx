import React, { useEffect } from "react";
import styled from "styled-components";
import { Socket } from "socket.io-client";
import { useParams } from "react-router";
import { ExplorerURLParams } from "../Editor/Explorer/helpers";
import { Colors } from "constants/Colors";

const Canvas = styled.canvas`
  position: absolute;
  top: 0px;
  left: 0px;
  height: calc(100% + ${(props) => props.theme.canvasBottomPadding}px);
  width: 100%;
  overflow-y: auto;
  z-index: 1;
  pointer-events: none;
`;

const POINTER_MARGIN = 12;
const POINTER_PADDING_X = 15;
const POINTER_PADDING_Y = 5;
const PX_PER_CHAR = 10;

const drawMousePointer = (
  ctx: any,
  x: number,
  y: number,
  width: number,
  height = 25,
  radius = 2,
) => {
  if (width < 2 * radius) radius = width / 2;
  if (height < 2 * radius) radius = height / 2;
  ctx.fillStyle = Colors.GOLD;
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

function CanvasMultiPointerArena({
  pageLevelSocket,
}: {
  pageLevelSocket: Socket;
}) {
  const { pageId } = useParams<ExplorerURLParams>();
  let pointerData: { [s: string]: any } = {};

  let selectionCanvas: any;
  useEffect(() => {
    selectionCanvas = document.getElementById("multiplayer-canvas");
    const rect = selectionCanvas.getBoundingClientRect();
    if (!!selectionCanvas) {
      selectionCanvas.width = rect.width;
      selectionCanvas.height = rect.height;
    }
    pageLevelSocket.connect();
    pageLevelSocket.emit("collab:start_edit", pageId);
    return () => {
      pageLevelSocket.emit("collab:leave_edit");
      pageLevelSocket.disconnect();
    };
  }, []);

  const drawPointers = async () => {
    const ctx = selectionCanvas.getContext("2d");
    const rect = selectionCanvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);

    ctx.font = "14px Verdana";
    Object.keys(pointerData).forEach((socId: string) => {
      const eventData = pointerData[socId];
      drawMousePointer(
        ctx,
        eventData.data.x,
        eventData.data.y,
        eventData?.user?.email.length * PX_PER_CHAR || 0,
      );
      ctx.fillStyle = Colors.BLACK;
      ctx.fillText(
        `${eventData?.user?.email}`,
        eventData.data.x + POINTER_MARGIN + POINTER_PADDING_Y,
        eventData.data.y + POINTER_MARGIN + POINTER_PADDING_X,
      );
    });
  };

  useEffect(() => {
    const drawingInterval = setInterval(() => drawPointers(), 50);
    const clearPointerDataInterval = setInterval(() => {
      pointerData = {};
    }, 120000);
    return () => {
      clearInterval(drawingInterval);
      clearInterval(clearPointerDataInterval);
    };
  }, []);

  useEffect(() => {
    pageLevelSocket.on(
      "collab:mouse_pointer",
      (eventData: {
        data: { x: number; y: number };
        socketId: string;
        user: any;
      }) => {
        if (
          eventData &&
          selectionCanvas &&
          pageLevelSocket.id !== eventData.socketId
        ) {
          pointerData[eventData.socketId] = eventData;
        }
      },
    );
  }, []);

  return <Canvas id="multiplayer-canvas" />;
}

export default CanvasMultiPointerArena;
