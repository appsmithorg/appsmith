import type { ReactElement } from "react";
import React from "react";
import styled from "styled-components";
import Icon, { IconSize } from "../Icon";
import CloseButton from "CloseButton";
import { createMessage, LEARN_MORE } from "../constants/messages";

export enum NotificationVariant {
  error,
  warning,
  enterprise,
  info,
}

export interface NotificationBannerProps {
  icon?: string;
  variant: NotificationVariant;
  canClose?: boolean;
  onClose?: any;
  children?: ReactElement | ReactElement[];
  style?: React.CSSProperties;
  learnMoreClickHandler?: any;
  className?: string;
  noLearnMoreArrow?: boolean;
}

const FlexContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  flex: 1;
  padding: 8px;
  position: relative;
  max-width: 486px;
  width: 100%;
  min-height: 56px;

  &.error {
    background-color: var(--ads-notification-banner-error-background-color);
    color: var(--ads-notification-banner-error-text-color);
  }

  &.enterprise {
    background-color: var(
      --ads-notification-banner-light-enterprise-text-color
    );
  }

  &.warning {
  }
`;

const LinkText = styled.a`
  color: ${(props: any) => props.color};
  cursor: pointer;
  font-weight: 500;
  margin-left: 0;
  display: flex;
  flex: 1;

  &:hover {
    color: ${(props: any) => props.color};
  }
`;

const NOTIFICATION_VARIANT_MAP = {
  [NotificationVariant.error]: (icon?: string) => ({
    icon: (
      <Icon
        fillColor="var(--ads-old-error-600)"
        name={icon || "danger"}
        size={IconSize.XXL}
      />
    ),
    closeButtonColor: "var(--ads-old-error-600)",
    linkTextColor: "var(--ads-old-error-600)",
  }),
  [NotificationVariant.info]: (icon?: string) => ({
    icon: (
      <Icon
        fillColor={"var(--ads-old-color-pure-black)"}
        name={icon || "info"}
        size={IconSize.XXL}
      />
    ),
    closeButtonColor: "var(--ads-color-black-900)",
    linkTextColor: "var(--ads-color-black-900)",
  }),
  [NotificationVariant.warning]: (icon?: string) => ({
    icon: (
      <Icon
        fillColor={"var(--ads-old-color-burning-orange)"}
        name={icon || "warning-line"}
        size={IconSize.XXL}
      />
    ),
    closeButtonColor: "var(--ads-old-warning-600)",
    linkTextColor: "var(--ads-old-warning-600)",
  }),
  [NotificationVariant.enterprise]: (icon?: string) => ({
    icon: (
      <Icon
        fillColor={"var(--ads-old-color-curious-blue)"}
        name={icon || "enterprise"}
        size={IconSize.XXL}
      />
    ),
    closeButtonColor: "var(--ads-old-color-curious-blue)",
    linkTextColor: "var(--ads-notification-banner-dark-enterprise-text-color)",
  }),
};

const TextContainer = styled.div`
  width: calc(100% - 64px);
`;

const CloseButtonContainer = styled.div`
  display: flex;
  justify-items: center;

  & button {
    color: ${(props) => props.color};

    &.notification-banner-close-button {
      right: 0;
    }

    &.bp3-button.bp3-minimal:hover {
      background-color: transparent;
    }
  }
`;
const IconContainer = styled.div`
  margin-right: 8px;
  align-self: start;

  & svg {
    cursor: unset;

    &:hover {
      cursor: unset;
    }
  }
`;
const LearnMoreContainer = styled.div`
  margin-top: 8px;
`;

export default function NotificationBanner(props: NotificationBannerProps) {
  const { learnMoreClickHandler, onClose } = props;
  const variant = props?.variant;
  const propIcon = props?.icon;
  const noLearnMoreArrow = props?.noLearnMoreArrow || false;
  const { closeButtonColor, icon, linkTextColor } =
    NOTIFICATION_VARIANT_MAP[variant](propIcon);
  return (
    <FlexContainer
      className={props.className || ""}
      data-testid="t--notification-banner"
      style={props.style}
    >
      {props?.icon && <IconContainer>{icon}</IconContainer>}
      <TextContainer>
        {props.children}
        {learnMoreClickHandler && (
          <LearnMoreContainer>
            <LinkText
              className="t--notification-banner-learn-more"
              color={linkTextColor}
              onClick={learnMoreClickHandler}
            >
              {createMessage(LEARN_MORE)}
              {!noLearnMoreArrow && (
                <Icon name="right-arrow" size={IconSize.XL} />
              )}
            </LinkText>
          </LearnMoreContainer>
        )}
      </TextContainer>
      <CloseButtonContainer>
        {props.canClose && (
          <CloseButton
            className={"notification-banner-close-button"}
            color={closeButtonColor}
            onClick={onClose}
            size={16}
          />
        )}
      </CloseButtonContainer>
    </FlexContainer>
  );
}
