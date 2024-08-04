import type React from "react";

export interface Header {
  heading: string;
  subHeadings: string[];
}

export interface CarouselTrigger {
  icon: string;
  heading: string;
  details: string[];
}

export interface Carousel {
  triggers: CarouselTrigger[];
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  targets: any[];
  design:
    | "split-left-trigger"
    | "split-right-trigger"
    | "trigger-contains-target"
    | "no-target";
}

export interface Footer {
  onClick: ((event: React.MouseEvent<HTMLElement>) => void) | undefined;
  message: string;
  showHeading?: boolean;
  isEnterprise?: boolean;
}
export interface UpgradePageProps {
  header: Header;
  carousel: Carousel;
  footer: Footer;
}

export type HeaderProps = Header;

export type CarouselProps = Carousel;

export type FooterProps = Footer;
