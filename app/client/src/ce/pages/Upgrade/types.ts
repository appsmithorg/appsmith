import React from "react";

export type Header = {
  heading: string;
  subHeadings: string[];
};

export type CarouselTrigger = {
  icon: string;
  heading: string;
  details: string[];
};

export type Carousel = {
  triggers: CarouselTrigger[];
  targets: any[];
};

export type Footer = {
  onClick: ((event: React.MouseEvent<HTMLElement>) => void) | undefined;
  message: string;
};
export type UpgradePageProps = {
  header: Header;
  carousel: Carousel;
  footer: Footer;
};

export type HeaderProps = Header;

export type CarouselProps = Carousel;

export type FooterProps = Footer;
