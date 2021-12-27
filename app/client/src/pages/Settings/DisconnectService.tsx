import React from "react";
import styled from "styled-components";
import { Variant } from "components/ads/common";
import Button from "components/ads/Button";
import { Callout } from "./Callout";

export const Container = styled.div`
  width: 100%;
  padding: 16px 0;
`;

export const DisconnectButton = styled(Button)`
  display: inline-block;
  padding: 10px 20px;
  font-size: 13px;
  height: 38px;
  margin-top: 16px;
  background: #c91818;
  border: 2px solid #c91818;
`;

export const Header = styled.h2`
  font-size: 24px;
  font-style: normal;
  font-weight: 500;
  line-height: 28px;
  letter-spacing: -0.23999999463558197px;
  text-align: left;
`;

export const HeaderDanger = styled(Header)`
  color: #c91818;
`;

export const Info = styled.h3`
  display: block;
  font-size: 14px;
  font-style: normal;
  font-weight: 400;
  line-height: 19px;
  letter-spacing: -0.23999999463558197px;
  text-align: left;
  margin: 8px 0;
`;

export function DisconnectService(props: {
  disconnect: () => void;
  subHeader: string;
  warning: string;
}) {
  return (
    <Container>
      <HeaderDanger>Danger Zone</HeaderDanger>
      <Info>{props.subHeader}</Info>
      <Callout actionLabel="Learn More" title={props.warning} type="Warning" />
      <DisconnectButton
        onClick={props.disconnect}
        text="Disconnect"
        variant={Variant.danger}
      />
    </Container>
  );
}
