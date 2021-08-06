import React from "react";
import { useSelector } from "react-redux";
import styled from "styled-components";
import { getDebuggerErrors } from "selectors/debuggerSelectors";
import LogItem, { getLogItemProps } from "./LogItem";
import { BlankState } from "./helpers";
import { createMessage, NO_ERRORS } from "constants/messages";
import { useBootIntercom } from "./hooks";

const ContainerWrapper = styled.div`
  overflow: hidden;
  height: 100%;
`;

const ListWrapper = styled.div`
  overflow: auto;
  height: 100%;
`;

function Errors(props: { hasShortCut?: boolean }) {
  const errors = useSelector(getDebuggerErrors);
  const expandId = useSelector((state: any) => state.ui.debugger.expandId);
  useBootIntercom();

  return (
    <ContainerWrapper>
      <ListWrapper className="debugger-list">
        {!Object.values(errors).length ? (
          <BlankState
            hasShortCut={props.hasShortCut}
            placeholderText={createMessage(NO_ERRORS)}
          />
        ) : (
          Object.values(errors).map((e, index) => {
            const logItemProps = getLogItemProps(e);
            const id = Object.keys(errors)[index];

            return (
              <LogItem
                key={`debugger-${index}`}
                {...logItemProps}
                expand={id === expandId}
              />
            );
          })
        )}
      </ListWrapper>
    </ContainerWrapper>
  );
}

export default Errors;
