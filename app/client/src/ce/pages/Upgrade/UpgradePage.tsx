import React from "react";
import styled from "styled-components";
import { HeaderComponent as Header } from "./Header";
import { CarouselComponent as Carousel } from "./Carousel";
import { FooterComponent as Footer } from "./Footer";
import { UpgradePageProps } from "./types";

export const ExternalContainer = styled.div`
  display: flex;
  flex-grow: 1;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 50px);
  max-height: 100vh;
  border-left: thin solid var(--appsmith-color-black-50);
  background-color: var(--ads-color-black-50);
`;

export const InternalContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  gap: 32px;
  justify-content: center;
  align-items: center;
`;

export default function UpgradePage(props: UpgradePageProps) {
  const { carousel, footer, header } = props;
  return (
    <ExternalContainer
      className="upgrade-page-container"
      data-testid="t--upgrade-page-container"
    >
      <InternalContainer>
        <Header {...header} />
        <Carousel {...carousel} />
        <Footer {...footer} />
      </InternalContainer>
    </ExternalContainer>
  );
}
