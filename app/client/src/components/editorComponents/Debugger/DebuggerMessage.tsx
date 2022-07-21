import { CLICK_ON, createMessage } from "@appsmith/constants/messages";
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

type DebuggerMessageProps = {
  onClick: () => void;
  secondHalfText: string;
};

function DebuggerMessage(props: DebuggerMessageProps) {
  return (
    <Container>
      {createMessage(CLICK_ON)}
      <StyledButton className="message" onClick={props.onClick} />
      {props.secondHalfText}
    </Container>
  );
}

export default DebuggerMessage;
