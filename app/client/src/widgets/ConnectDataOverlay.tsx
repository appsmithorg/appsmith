import { Colors } from "constants/Colors";

import { Button } from "@appsmith/ads";
import React from "react";
import styled from "styled-components";

const Wrapper = styled.div`
  position: absolute;
  z-index: 9;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  background: #ffffff61;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: all !important;
`;

const Container = styled.div`
  text-align: center;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px;
  height: 100%;
  justify-content: center;
  backdrop-filter: blur(1px);
`;

const Header = styled.div`
  font-weight: 600;
  font-size: 16px;
  line-height: 24px;
  color: ${Colors.GREY_900};
  margin-bottom: 12px;
`;

const ConnecData = styled(Button)`
  margin-bottom: 16px;
`;

export function ConnectDataOverlay(props: {
  onConnectData: () => void;
  message: string;
  btnText: string;
}) {
  const onClick = () => {
    props.onConnectData();
  };

  return (
    <Wrapper>
      <Container>
        <Header className="t--cypress-table-overlay-header">
          {props.message}
        </Header>
        <ConnecData
          className="t--cypress-table-overlay-connectdata"
          id={"table-overlay-connectdata"}
          onClick={onClick}
          size="md"
        >
          {props.btnText}
        </ConnecData>
      </Container>
    </Wrapper>
  );
}
