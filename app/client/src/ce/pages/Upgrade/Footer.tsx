import styled from "styled-components";
import React from "react";
import { Button, Text } from "@appsmith/ads";
import type { FooterProps } from "./types";
import {
  AVAILABLE_ON_BUSINESS,
  AVAILABLE_ON_ENTERPRISE,
  createMessage,
  UPGRADE,
} from "ee/constants/messages";

const FooterContainer = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 112px;
  gap: 20px;
  padding: 16px 20px;
  background-color: var(--ads-v2-color-bg);

  & .left {
    min-width: 362px;
    width: 50%;
    flex-grow: 9;
    display: flex;
    flex-direction: column;
  }

  & .right {
    flex-grow: 1;
    text-align: end;
  }
`;

export function FooterComponent(props: FooterProps) {
  const { isEnterprise = false, message, onClick, showHeading = true } = props;

  return (
    <FooterContainer
      className="upgrade-page-footer-container"
      data-testid="t--upgrade-page-footer-container"
    >
      <div className="left">
        {showHeading && (
          <div className="heading-container">
            <Text
              color="var(ads-v2-color-fg-emphasis-plus)"
              kind="heading-m"
              renderAs="h1"
            >
              {createMessage(
                isEnterprise ? AVAILABLE_ON_ENTERPRISE : AVAILABLE_ON_BUSINESS,
              )}
            </Text>
          </div>
        )}
        <div className="text-container">
          <Text color="var(--ads-v2-color-fg)" renderAs="p">
            {message}
          </Text>
        </div>
      </div>
      <div className="right">
        <Button data-testid="t--button-upgrade" onClick={onClick} size="md">
          {createMessage(UPGRADE)}
        </Button>
      </div>
    </FooterContainer>
  );
}
