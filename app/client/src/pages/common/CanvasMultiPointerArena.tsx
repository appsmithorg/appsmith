import React, { useCallback, useEffect } from "react";
import styled from "styled-components";
import { io } from "socket.io-client";
import { useParams } from "react-router";
import { ExplorerURLParams } from "../Editor/Explorer/helpers";
import { throttle } from "lodash";

const pageLevelSocket = io("/page/edit");

const Canvas = styled.canvas`
  position: absolute;
  top: 0px;
  left: 0px;
  height: calc(100% + ${(props) => props.theme.canvasBottomPadding}px);
  width: 100%;
  overflow-y: auto;
  z-index: 1;
`;

function CanvasMultiPointerArena() {
  const { pageId } = useParams<ExplorerURLParams>();

  const delayedShareMousePointer = useCallback(
    throttle((e) => shareMousePointer(e), 50, { trailing: false }),
    [],
  );

  const shareMousePointer = (e: any) => {
    if (!!pageLevelSocket) {
      const selectionCanvas: any = document.getElementById(
        "multiplayer-canvas",
      );
      const rect = selectionCanvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      pageLevelSocket.emit("collab:mouse_pointer", {
        data: { x, y },
        pageId,
      });
    }
  };

  useEffect(() => {
    pageLevelSocket.connect();
    pageLevelSocket.emit("collab:start_edit", pageId);
    return () => {
      pageLevelSocket.emit("collab:leave_edit");
      pageLevelSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    pageLevelSocket.on("collab:mouse_pointer", (eventData: any) => {
      console.log("mouse pointer :", eventData);
    });
  }, []);
  return (
    <Canvas
      id="multiplayer-canvas"
      onMouseMove={(e) => {
        e.persist();
        delayedShareMousePointer(e);
      }}
    />
  );
}

export default CanvasMultiPointerArena;
