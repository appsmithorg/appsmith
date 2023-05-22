import { Colors } from "constants/Colors";
import React from "react";
import styled from "styled-components";

const Wrapper = styled.div`
  position: absolute;
  z-index: 9;
  top: 0px;
  left: 0pc;
  height: 100%;
  width: 100%;
  background: #ffffff61;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Container = styled.div`
  max-width: 440px;
  text-align: center;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px;
`;

const Header = styled.div`
  font-weight: 600;
  font-size: 16px;
  line-height: 24px;
  color: ${Colors.GREY_900};
  margin-bottom: 15px;
`;

const ConnecData = styled.button`
  padding: 6px 15px;
  max-width: 250px;
  margin-bottom: 15px;
  width: 100%;
  background: #f86a2b;
  color: #fff;
  font-size: 12px;
`;

const Footer = styled.div`
  font-weight: 400;
  font-size: 14px;
  line-height: 22px;
`;

export function ConnectDataOverlay(props: { onConnectData: () => void }) {
  return (
    <Wrapper>
      <Container>
        <Header className="t--cypress-table-overlay-header">
          Connect your or sample datasources to display data
        </Header>
        <ConnecData
          className="t--cypress-table-overlay-connectdata"
          onClick={props.onConnectData}
        >
          CONNECT DATA
        </ConnecData>
        <Footer>or write a new binding</Footer>
      </Container>
    </Wrapper>
  );
}
