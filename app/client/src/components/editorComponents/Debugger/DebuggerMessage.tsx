import React from "react";
import styled from "styled-components";
import { DebugButton } from "./DebugCTA";

const StyledButton = styled(DebugButton)`
  display: inline-flex;
`;

const Container = styled.div`
  padding: 15px 0px;
  color: #716e6e;
  font-size: 14px;
  font-weight: normal;
`;

const DebuggerMessage = (props: any) => {
  return (
    <Container>
      🙌 Click on <StyledButton className="message" onClick={props.onClick} />{" "}
      to open the issue in debugger
    </Container>
  );
};

export default DebuggerMessage;
