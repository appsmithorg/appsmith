import styled from "styled-components";
import React from "react";
import type { HeaderProps } from "./types";
import { Text } from "@appsmith/ads";

export const HeaderContainer = styled.div`
  padding: 32px 32px 20px;
  margin: auto;
  text-align: center;

  & .header-subHeadings-container {
    margin: 8px auto;
    max-width: 720px;
  }
`;

export function HeaderComponent(props: HeaderProps) {
  const subHeadings = props.subHeadings?.map((sub: string, index: number) => (
    <div
      className="header-subHeading-container"
      data-testid={`t--header-subHeading-container-${index}`}
      key={`subHeading-${index}`}
    >
      <Text
        color="var(--ads-v2-color-fg-emphasis)"
        kind="action-l"
        renderAs="p"
      >
        {sub}
      </Text>
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
        <Text
          color="var(--ads-v2-color-fg-emphasis-plus)"
          kind="heading-xl"
          renderAs="h1"
        >
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
