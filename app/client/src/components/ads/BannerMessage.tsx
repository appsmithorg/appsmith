import React from "react";
import styled from "styled-components";

import Icon, { IconSize } from "components/ads/Icon";

type Props = {
  backgroundColor: string;
  className: string;
  icon: string;
  iconColor: string;
  iconSize: IconSize;
  messageHeader?: string;
  message: string;
  textColor: string;
};

const MessageContainer = styled.div<{
  backgroundColor: string;
  textColor: string;
}>`
  display: flex;
  padding: 8px;
  margin-bottom: 8px;
  flex-direction: row;
  color: ${(props) => props.textColor};
  background: ${(props) => props.backgroundColor};
  }
`;
const StyledIcon = styled(Icon)`
  padding: 10px;
  cursor: default;

  svg {
    cursor: default;
  }
`;

const MessageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  padding-left: 4px;
  line-height: 16px;
`;

const MessageText = styled.p`
  font-size: 13px;
  font-weight: 400;
`;

const MessageHeader = styled.h2`
  font-size: 14px;
  font-weight: 600;
  padding-bottom: 5px;
`;

export function BannerMessage(props: Props) {
  return (
    <MessageContainer
      backgroundColor={props.backgroundColor}
      className={props.className}
      textColor={props.textColor}
    >
      <StyledIcon
        fillColor={props.iconColor}
        name={props.icon}
        size={props.iconSize}
      />
      <MessageWrapper>
        {props.messageHeader && (
          <MessageHeader>{props.messageHeader}</MessageHeader>
        )}
        <MessageText>{props.message}</MessageText>
      </MessageWrapper>
    </MessageContainer>
  );
}
