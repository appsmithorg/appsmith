import styled from "styled-components";
import React from "react";
import { Button, Size, Text, TextType } from "design-system";
import { Variant } from "design-system/build/constants/variants";
import { FooterProps } from "./types";

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

    //& .text-container {
    //  width: 288px;
    //}
  }

  & .right {
    flex-grow: 1;
  }
`;

export function FooterComponent(props: FooterProps) {
  const { message, onClick } = props;
  return (
    <FooterContainer
      className="upgrade-page-footer-container"
      data-testid="t--upgrade-page-footer-container"
    >
      <div className="left">
        <div className="heading-container">
          <Text type={TextType.H1}>Available on a business plan only</Text>
        </div>
        <div className="text-container">
          <Text type={TextType.P1}>{message}</Text>
        </div>
      </div>
      <div className="right">
        <Button
          onClick={onClick}
          size={Size.large}
          text="UPGRADE"
          type="button"
          variant={Variant.info}
        />
      </div>
    </FooterContainer>
  );
}
