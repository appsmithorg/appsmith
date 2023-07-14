import { logger } from "@sentry/utils";
import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import type { ActionData } from "reducers/entityReducers/actionsReducer";
import { getSocketActions } from "selectors/entitiesSelector";
import { useSocket, useSocketEvent } from "socket.io-react-hook";

const SocketLayer = ({ action }: { action: ActionData }) => {
  const url = action.config.datasource.datasourceConfiguration?.url;
  const { error, socket } = useSocket({ path: "/action-rts" });
  const { lastMessage } = useSocketEvent<string>(socket, "message", {
    onMessage: (message: any) => {
      logger.log("SOCKET : ", message);
    },
    onerror: (error: any) => {
      logger.log("SOCKET:", error);
    },
  });

  const sendEvent = () => {
    socket.emit(
      "data",
      JSON.stringify({
        path: url,
        actionId: action.config.id,
        type: "create",
      }),
    );
  };

  useEffect(() => {
    return () => {
      socket.close();
    };
  }, []);

  logger.log("SOCKET :", lastMessage, socket.connected, error);
  return (
    <button
      id={`send-event-${action.config.id}`}
      onClick={sendEvent}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        opacity: 0,
        visibility: "hidden",
      }}
    >
      Hello
    </button>
  );
};

const SocketLayers = () => {
  const actions: ActionData[] = useSelector(getSocketActions);
  logger.log("SOCKET :", actions);
  const filteredActions = actions.filter(
    (action) => action.config.datasource.datasourceConfiguration?.url,
  );
  return (
    <>
      {filteredActions.map((action) => (
        <SocketLayer action={action} key={action.config.id} />
      ))}
    </>
  );
};

export default SocketLayers;
