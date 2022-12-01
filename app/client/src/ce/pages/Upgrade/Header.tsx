import styled from "styled-components";
import React from "react";
import { HeaderProps } from "./types";
import { FontWeight, Text, TextType } from "design-system";

export const HeaderContainer = styled.div`
  width: 496px;
  text-align: center;
  height: 120px;
  padding: 32px;

  & .header-heading-container {
    & .cs-text {
      font-size: 32px;
      line-height: 38px;
    }
  }

  & .header-subHeadings-container {
    & .header-subHeading-container {
      & .cs-text {
        font-size: 16px;
      }
    }
  }
`;

export function HeaderComponent(props: HeaderProps) {
  const subHeadings = props.subHeadings?.map((sub: string, index: number) => (
    <div
      className="header-subHeading-container"
      data-testid={`t--header-subHeading-container-${index}`}
      key={`subHeading-${index}`}
    >
      <Text type={TextType.P1}>{sub}</Text>
    </div>
  ));
  return (
    <HeaderContainer
      className="upgrade-page-header-container"
      data-testid="t--upgrade-page-header-container"
    >
      <div
        className="header-heading-container"
        data-testid="t--header-heading-container"
      >
        <Text type={TextType.H1} weight={FontWeight.BOLD}>
          {props.heading}
        </Text>
      </div>
      <div
        className="header-subHeadings-container"
        data-testid="t--header-subHeadings-container"
      >
        {subHeadings}
      </div>
    </HeaderContainer>
  );
}
