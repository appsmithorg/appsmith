import styled from "styled-components";
import React from "react";
import { HeaderProps } from "./types";
import { FontWeight, Text, TextType } from "design-system";

export const HeaderContainer = styled.div`
  padding: 32px 32px 20px;
  margin: auto;
  text-align: center;

  & .header-heading-container {
    & .cs-text {
      font-size: 32px;
      line-height: 38px;
    }
  }

  & .header-subHeadings-container {
    margin: 8px auto;
    max-width: 720px;
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
