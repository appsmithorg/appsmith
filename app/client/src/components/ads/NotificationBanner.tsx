import React, { ReactElement } from "react";
import styled from "styled-components";
import Icon, { IconSize } from "components/ads/Icon";
import { Colors } from "constants/Colors";
import { CloseButton } from "components/designSystems/appsmith/CloseButton";
import { createMessage, LEARN_MORE } from "@appsmith/constants/messages";

export enum NotificationVariant {
  error,
  warning,
  enterprise,
  info,
}

export type NotificationBannerProps = {
  icon?: string;
  variant: NotificationVariant;
  canClose?: boolean;
  onClose?: any;
  children?: ReactElement | ReactElement[];
  style?: React.CSSProperties;
  learnMoreClickHandler?: any;
  className?: string;
};

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
    background-color: ${Colors.ERROR_50};
  }

  &.enterprise {
    background-color: #e8f5fa;
  }

  &.warning {
  }
`;

const LinkText = styled.a`
  color: ${Colors.CRUSTA};
  cursor: pointer;
  font-weight: 500;
  margin-left: 0;
`;

const NOTIFICATION_VARIANT_MAP = {
  [NotificationVariant.error]: (icon?: string) => ({
    icon: (
      <Icon
        fillColor={Colors.ERROR_600}
        name={icon || "danger"}
        size={IconSize.XXL}
      />
    ),
    closeButtonColor: Colors.ERROR_600,
  }),
  [NotificationVariant.info]: (icon?: string) => ({
    icon: (
      <Icon
        fillColor={Colors.BLACK}
        name={icon || "info"}
        size={IconSize.XXL}
      />
    ),
    closeButtonColor: Colors.GREY_900,
  }),
  [NotificationVariant.warning]: (icon?: string) => ({
    icon: (
      <Icon
        fillColor={Colors.BURNING_ORANGE}
        name={icon || "warning-line"}
        size={IconSize.XXL}
      />
    ),
    closeButtonColor: Colors.WARNING_600,
  }),
  [NotificationVariant.enterprise]: (icon?: string) => ({
    icon: (
      <Icon
        fillColor={Colors.CURIOUS_BLUE}
        name={icon || "enterprise"}
        size={IconSize.XXL}
      />
    ),
    closeButtonColor: Colors.CURIOUS_BLUE,
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
const LearnMoreContainer = styled.div``;

export function NotificationBanner(props: NotificationBannerProps) {
  const variant = props?.variant;
  const propIcon = props?.icon;
  const { closeButtonColor, icon } = NOTIFICATION_VARIANT_MAP[variant](
    propIcon,
  );
  return (
    <FlexContainer className={props.className} style={props.style}>
      {props?.icon && <IconContainer>{icon}</IconContainer>}
      <TextContainer>
        {props.children}
        {props?.learnMoreClickHandler && (
          <LearnMoreContainer>
            <LinkText onClick={props?.learnMoreClickHandler}>
              {createMessage(LEARN_MORE)}
            </LinkText>
          </LearnMoreContainer>
        )}
      </TextContainer>
      <CloseButtonContainer>
        {props.canClose && (
          <CloseButton
            className={"notification-banner-close-button"}
            color={closeButtonColor}
            onClick={props.onClose}
            size={16}
          />
        )}
      </CloseButtonContainer>
    </FlexContainer>
  );
}
