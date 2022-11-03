import React from "react";
import styled from "styled-components";
import { HeaderComponent as Header } from "./Header";
import { CarouselComponent as Carousel } from "./Carousel";
import { FooterComponent as Footer } from "./Footer";
import { UpgradePageProps } from "./types";

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1 1;
  border-left: thin solid var(--appsmith-color-black-50);
  background-color: var(--ads-color-black-50);
  align-items: center;
  justify-items: center;
  height: calc(100vh - 50px - 112px);
  min-width: 1180px;
  min-height: 0;
  overflow: auto;
  gap: 32px;
`;

export default function UpgradePage(props: UpgradePageProps) {
  const { carousel, footer, header } = props;
  return (
    <Container
      className="upgrade-page-container"
      data-testid="t--upgrade-page-container"
    >
      <Header {...header} />
      <Carousel {...carousel} />
      <Footer {...footer} />
    </Container>
  );
}
