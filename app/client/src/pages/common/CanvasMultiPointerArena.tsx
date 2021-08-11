import React, { useEffect } from "react";
import styled from "styled-components";
import { Socket } from "socket.io-client";
import { useParams } from "react-router";
import { ExplorerURLParams } from "../Editor/Explorer/helpers";

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
    ctx.font = "16px Georgia";
    Object.keys(pointerData).forEach((socId: string) => {
      const eventData = pointerData[socId];
      ctx.fillText(
        `${eventData?.user?.email}`,
        eventData.data.x,
        eventData.data.y,
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
