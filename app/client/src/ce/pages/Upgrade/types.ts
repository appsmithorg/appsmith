import type React from "react";

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
  design:
    | "split-left-trigger"
    | "split-right-trigger"
    | "trigger-contains-target"
    | "no-target";
};

export type Footer = {
  onClick: ((event: React.MouseEvent<HTMLElement>) => void) | undefined;
  message: string;
  showHeading?: boolean;
};
export type UpgradePageProps = {
  header: Header;
  carousel: Carousel;
  footer: Footer;
};

export type HeaderProps = Header;

export type CarouselProps = Carousel;

export type FooterProps = Footer;
