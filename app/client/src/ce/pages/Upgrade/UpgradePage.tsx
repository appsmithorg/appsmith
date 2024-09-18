import React from "react";
import styled from "styled-components";
import { HeaderComponent as Header } from "./Header";
import { CarouselComponent as Carousel } from "./Carousel";
import { FooterComponent as Footer } from "./Footer";
import type { UpgradePageProps } from "./types";

export const Container = styled.div`
  background-color: var(--ads-v2-color-bg-subtle);
  min-height: 0;
  width: 100%;
  position: relative;

  .scroll-container {
    height: calc(100vh - 50px - 112px);
    overflow: auto;
  }
`;

export default function UpgradePage(props: UpgradePageProps) {
  const { carousel, footer, header } = props;

  return (
    <Container
      className="upgrade-page-container"
      data-testid="t--upgrade-page-container"
    >
      <div className="scroll-container">
        <Header {...header} />
        <Carousel {...carousel} />
      </div>
      <Footer {...footer} />
    </Container>
  );
}
