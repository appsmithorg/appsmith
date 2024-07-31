import React from "react";
import * as HoverCard from "@radix-ui/react-hover-card";
import clsx from "classnames";

import type { AnnouncementPopoverContentProps } from "./AnnouncementPopover.types";
import {
  StyledTitle,
  StyledBanner,
  StyledContent,
  StyledCustomBody,
  StyledDescription,
  StyledFooter,
} from "./AnnouncementPopover.styles";
import {
  AnnouncementPopoverArrowClassName,
  AnnouncementPopoverBannerClassName,
  AnnouncementPopoverBannerCloseClassName,
  AnnouncementPopoverBodyClassName,
  AnnouncementPopoverBodyDescriptionClassName,
  AnnouncementPopoverBodyFooterClassName,
  AnnouncementPopoverBodyTitleClassName,
  AnnouncementPopoverContentClassName,
  AnnouncementPopoverTriggerClassName,
} from "./AnnouncementPopover.constants";
import { Button } from "../Button";

const AnnouncementPopover = HoverCard.Root;
AnnouncementPopover.displayName = "AnnouncementPopover";

function AnnouncementPopoverTrigger(props: HoverCard.HoverCardTriggerProps) {
  return (
    <HoverCard.Trigger
      className={`${AnnouncementPopoverTriggerClassName} ${props.className}`}
      {...props}
      asChild
    >
      {props.children}
    </HoverCard.Trigger>
  );
}

function AnnouncementPopoverContent({
  arrowFillColor = "var(--ads-v2-colors-content-surface-default-bg)",
  banner,
  className,
  description,
  footer,
  onCloseButtonClick,
  title,
  ...rest
}: AnnouncementPopoverContentProps) {
  return (
    <HoverCard.Portal>
      <StyledContent
        {...rest}
        className={clsx(AnnouncementPopoverContentClassName, className)}
      >
        <StyledBanner
          backgroundUrl={banner}
          className={AnnouncementPopoverBannerClassName}
        >
          <Button
            className={AnnouncementPopoverBannerCloseClassName}
            isIconButton
            kind="tertiary"
            onClick={onCloseButtonClick}
            size="sm"
            startIcon="close-line"
          />
        </StyledBanner>
        <StyledCustomBody className={AnnouncementPopoverBodyClassName}>
          <StyledTitle
            className={AnnouncementPopoverBodyTitleClassName}
            kind="heading-s"
            renderAs="h4"
          >
            {title}
          </StyledTitle>
          <StyledDescription
            className={AnnouncementPopoverBodyDescriptionClassName}
            kind="body-m"
          >
            {description}
          </StyledDescription>
          {footer && (
            <StyledFooter className={AnnouncementPopoverBodyFooterClassName}>
              {footer}
            </StyledFooter>
          )}
        </StyledCustomBody>
        <HoverCard.Arrow asChild className={AnnouncementPopoverArrowClassName}>
          <svg
            fill={arrowFillColor}
            height="11"
            viewBox="0 0 19 11"
            width="19"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M1.01473 9.51471L8.08579 2.44364C8.86684 1.66259 10.1332 1.66259 10.9142 2.44364L17.9853 9.51471H9.5H1.01473Z" />
            <path
              d="M1.01473 9.51471L8.08579 2.44364C8.86684 1.66259 10.1332 1.66259 10.9142 2.44364L17.9853 9.51471"
              stroke="var(--ads-v2-colors-content-container-default-border)"
              strokeLinecap="round"
            />
          </svg>
        </HoverCard.Arrow>
      </StyledContent>
    </HoverCard.Portal>
  );
}

export {
  AnnouncementPopover,
  AnnouncementPopoverTrigger,
  AnnouncementPopoverContent,
};
