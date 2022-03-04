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

type NotificationBannerProps = {
  hasIcon?: boolean;
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
  padding: 16px;
  position: relative;
  max-width: 486px;
  width: 100%;
  height: 56px;

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
  [NotificationVariant.error]: {
    icon: <Icon fillColor={Colors.RED} name="danger" size={IconSize.XXL} />,
    closeButtonColor: Colors.ERROR_600,
  },
  [NotificationVariant.info]: {
    icon: <Icon fillColor={Colors.BLACK} name="info" size={IconSize.XXL} />,
    closeButtonColor: Colors.GREY_900,
  },
  [NotificationVariant.warning]: {
    icon: (
      <Icon
        fillColor={Colors.BURNING_ORANGE}
        name="warning"
        size={IconSize.XXL}
      />
    ),
    closeButtonColor: Colors.WARNING_600,
  },
  [NotificationVariant.enterprise]: {
    icon: (
      <Icon
        fillColor={Colors.CURIOUS_BLUE}
        name="enterprise"
        size={IconSize.XXL}
      />
    ),
    closeButtonColor: Colors.CURIOUS_BLUE,
  },
};

const TextContainer = styled.div`
  flex-grow: 1;
`;

const CloseButtonContainer = styled.div`
  display: flex;
  justify-items: center;
  & button {
    color: ${(props) => props.color};
  }
`;
const IconContainer = styled.div``;
const LearnMoreContainer = styled.div``;

export function NotificationBanner(props: NotificationBannerProps) {
  const { variant } = props;
  const { closeButtonColor, icon } = NOTIFICATION_VARIANT_MAP[variant];
  return (
    <FlexContainer className={props.className} style={props.style}>
      <IconContainer>{props.hasIcon && icon}</IconContainer>
      <TextContainer>
        {props.children}
        <LearnMoreContainer>
          <LinkText onClick={props.learnMoreClickHandler}>
            {createMessage(LEARN_MORE)}
          </LinkText>
        </LearnMoreContainer>
      </TextContainer>
      <CloseButtonContainer>
        {props.canClose && (
          <CloseButton
            color={closeButtonColor}
            onClick={props.onClose}
            onHoverBackgroundColor={Colors.TRANSPARENT}
            size={16}
          />
        )}
      </CloseButtonContainer>
    </FlexContainer>
  );
}
