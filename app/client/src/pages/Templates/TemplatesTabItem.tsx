import { TextType, Text, Classes } from "components/ads";
import Icon, { IconSize } from "components/ads/Icon";
import { Colors } from "constants/Colors";
import React, { ReactNode, Suspense } from "react";
import {
  INTRODUCING_TEMPLATES,
  createMessage,
  TEMPLATE_NOTIFICATION_DESCRIPTION,
} from "@appsmith/constants/messages";
import styled from "styled-components";

const NotificationWrapper = styled.div`
  background-color: ${Colors.SEA_SHELL};
  padding: ${(props) =>
    `${props.theme.spaces[4]}px ${props.theme.spaces[8]}px`};
  display: flex;
  flex-direction: row;
  max-width: 376px;

  .${Classes.ICON} {
    align-items: unset;
    margin-top: ${(props) => props.theme.spaces[0] + 1}px;
  }

  .text-wrapper {
    display: flex;
    flex-direction: column;
    margin-left: ${(props) => props.theme.spaces[3]}px;
  }

  .description {
    margin-top: ${(props) => props.theme.spaces[0] + 2}px;
  }
`;

export function TemplateFeatureNotification() {
  return (
    <NotificationWrapper>
      <Icon name={"info"} size={IconSize.XXXL} />
      <div className={"text-wrapper"}>
        <Text color={Colors.CODE_GRAY} type={TextType.H4}>
          {createMessage(INTRODUCING_TEMPLATES)}
        </Text>
        <Text
          className="description"
          color={Colors.CODE_GRAY}
          type={TextType.P1}
        >
          {createMessage(TEMPLATE_NOTIFICATION_DESCRIPTION)}
        </Text>
      </div>
    </NotificationWrapper>
  );
}

interface TemplatesTabItemProps {
  children: ReactNode;
}

export function TemplatesTabItem(props: TemplatesTabItemProps) {
  return <Suspense fallback={<div />}>{props.children}</Suspense>;
}
