import styled from "styled-components";
import React from "react";
import { Text } from "design-system";
import { Button } from "design-system";
import type { FooterProps } from "./types";
import { createMessage } from "design-system-old/build/constants/messages";
import { AVAILABLE_ON_BUSINESS, UPGRADE } from "../../constants/messages";

const FooterContainer = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  width: calc(100% - 264px - 16px);
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 112px;
  margin-left: calc(264px + 16px);
  gap: 20px;
  padding: 16px 20px;
  background-color: var(--ads-color-black-0);

  & .left {
    min-width: 362px;
    width: 50%;
    flex-grow: 9;
    display: flex;
    flex-direction: column;
  }

  & .right {
    flex-grow: 1;
  }
`;

export function FooterComponent(props: FooterProps) {
  const { message, onClick, showHeading = true } = props;
  return (
    <FooterContainer
      className="upgrade-page-footer-container"
      data-testid="t--upgrade-page-footer-container"
    >
      <div className="left">
        {showHeading && (
          <div className="heading-container">
            <Text
              color="var(ads-v2-color-fg-emphasis)"
              kind="heading-m"
              renderAs="h1"
            >
              {createMessage(AVAILABLE_ON_BUSINESS)}
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
        <Button onClick={() => onClick} size="md">
          {createMessage(UPGRADE)}
        </Button>
      </div>
    </FooterContainer>
  );
}
