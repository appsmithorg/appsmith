import React, { memo } from "react";
import styled from "styled-components";
import ErrorLogItem, { getLogItemProps } from "./ErrorLogItem";
import { BlankState } from "./helpers";
import { createMessage, NO_ERRORS } from "@appsmith/constants/messages";
import { thinScrollbar } from "constants/DefaultTheme";
import { Log } from "entities/AppsmithConsole";

const ContainerWrapper = styled.div`
  overflow: hidden;
  height: 100%;
`;

const ListWrapper = styled.div`
  overflow: auto;
  ${thinScrollbar};
  height: 100%;
  padding-bottom: 25px;
`;

function ErrorLog(props: {
  errors: Record<string, Log>;
  hasShortCut?: boolean;
}) {
  return (
    <ContainerWrapper>
      <ListWrapper className="debugger-list">
        {!Object.values(props.errors).length ? (
          <BlankState
            hasShortCut={props.hasShortCut}
            placeholderText={createMessage(NO_ERRORS)}
          />
        ) : (
          Object.values(props.errors).map((e, index) => {
            const logItemProps = getLogItemProps(e);
            const messages = e.messages || [];
            const logItems = [];
            if (messages) {
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
          })
        )}
      </ListWrapper>
    </ContainerWrapper>
  );
}

export default memo(ErrorLog);
