import React, { memo } from "react";
import styled from "styled-components";
import ErrorLogItem, { getLogItemProps } from "./ErrorLogItem";
import { BlankState } from "../helpers";
import { createMessage, NO_ERRORS } from "@appsmith/constants/messages";
import { thinScrollbar } from "constants/DefaultTheme";
import type { Log } from "entities/AppsmithConsole";

const ContainerWrapper = styled.div`
  overflow: hidden;
  height: 100%;
`;

const ListWrapper = styled.div`
  overflow-wrap: anywhere;
  overflow: auto;
  ${thinScrollbar};
  height: 100%;
  padding-bottom: 25px;
`;

// This component is used to render the error logs in the debugger.
function ErrorLog(props: {
  errors: Record<string, Log>;
  hasShortCut?: boolean;
}) {
  // returns array of log items for each error in the error log.
  const getLogItem = (error: Log, index: number) => {
    const logItemProps = getLogItemProps(error);
    const messages = error.messages || [];
    const logItems = [];
    if (messages.length) {
      messages.forEach((message) => {
        logItemProps.messages = [message];
        logItems.push(
          <ErrorLogItem key={`debugger-${index}`} {...logItemProps} />,
        );
      });
    } else {
      logItems.push(
        <ErrorLogItem key={`debugger-${index}`} {...logItemProps} />,
      );
    }
    return logItems;
  };

  return (
    <ContainerWrapper>
      <ListWrapper className="debugger-list">
        {!Object.values(props.errors).length ? (
          <BlankState
            hasShortCut={props.hasShortCut}
            placeholderText={createMessage(NO_ERRORS)}
          />
        ) : (
          Object.values(props.errors).map((error, index) => {
            return getLogItem(error, index);
          })
        )}
      </ListWrapper>
    </ContainerWrapper>
  );
}

// Memoizing the component to avoid unnecessary re-renders
export default memo(ErrorLog);
