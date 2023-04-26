import { Colors } from "constants/Colors";
import { Button } from "design-system-old";
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
  max-width: 420px;
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

const ConnecData = styled(Button)`
  padding: 11px 15px;
  max-width: 250px;
  height: 30px;
  margin-bottom: 15px;
  width: 100%;
`;

const Footer = styled.div`
  font-weight: 400;
  font-size: 14px;
  color: ${Colors.GRAY_700};
  margin-top: 10px;
`;

export function ConnectDataOverlay() {
  return (
    <Wrapper>
      <Container>
        <Header>Connect your or sample datasources to display data</Header>
        <ConnecData text="Connect Data" />
        <Footer>or write a new binding</Footer>
      </Container>
    </Wrapper>
  );
}
