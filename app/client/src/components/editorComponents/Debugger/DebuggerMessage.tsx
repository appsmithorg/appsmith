import { CLICK_ON, createMessage, OPEN_THE_DEBUGGER } from "constants/messages";
import React from "react";
import styled from "styled-components";
import { DebugButton } from "./DebugCTA";

const StyledButton = styled(DebugButton)`
  display: inline-flex;
`;

const Container = styled.div`
  padding: 15px 0px;
  color: ${(props) => props.theme.colors.debugger.messageTextColor};
`;

function DebuggerMessage(props: any) {
  return (
    <Container>
      {createMessage(CLICK_ON)}
      <StyledButton className="message" onClick={props.onClick} />
      {createMessage(OPEN_THE_DEBUGGER)}
    </Container>
  );
}

export default DebuggerMessage;
