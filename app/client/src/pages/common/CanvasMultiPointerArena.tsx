import React, { useCallback, useEffect } from "react";
import styled from "styled-components";
import { io } from "socket.io-client";
import { useParams } from "react-router";
import { ExplorerURLParams } from "../Editor/Explorer/helpers";
import { throttle } from "lodash";
import { getCurrentUser } from "../../selectors/usersSelectors";
import { useSelector } from "react-redux";

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
  const currentUser = useSelector(getCurrentUser);
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
  const delayedShareMousePointer = useCallback(
    throttle((e) => shareMousePointer(e), 50, { trailing: false }),
    [shareMousePointer],
  );

  useEffect(() => {
    pageLevelSocket.connect();
    pageLevelSocket.emit("collab:start_edit", pageId);
    return () => {
      pageLevelSocket.emit("collab:leave_edit");
      pageLevelSocket.disconnect();
    };
  }, []);

  const throttledClearCanvas = useCallback(
    throttle((ctx, width, height) => ctx.clearRect(0, 0, width, height), 50, {
      trailing: false,
    }),
    [],
  );

  const drawPointers = (eventData: any) => {
    const selectionCanvas: any = document.getElementById("multiplayer-canvas");
    const rect = selectionCanvas.getBoundingClientRect();
    selectionCanvas.width = rect.width;
    selectionCanvas.height = rect.height;
    const ctx = selectionCanvas.getContext("2d");
    throttledClearCanvas(ctx, rect.width, rect.height);
    // ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.font = "16px Georgia";
    ctx.fillText(
      `${eventData?.user?.email}`,
      eventData.data.x,
      eventData.data.y,
    );
  };

  // const throttledDrawPointers = useCallback(
  //   throttle((e) => drawPointers(e), 10),
  //   [drawPointers],
  // );

  useEffect(() => {
    pageLevelSocket.on("collab:mouse_pointer", (eventData: any) => {
      if (eventData && eventData.user?.email !== currentUser?.email) {
        drawPointers(eventData);
      }
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
