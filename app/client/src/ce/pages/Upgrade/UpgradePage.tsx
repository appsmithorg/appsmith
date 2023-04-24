import React from "react";
import styled from "styled-components";
import { HeaderComponent as Header } from "./Header";
import { CarouselComponent as Carousel } from "./Carousel";
import { FooterComponent as Footer } from "./Footer";
import type { UpgradePageProps } from "./types";

export const Container = styled.div`
  background-color: var(--ads-v2-color-black-50);
  height: auto;
  min-height: 0;
  overflow: auto;
  height: calc(100vh - 50px - 112px);
  width: 100%;
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
