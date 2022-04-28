import React from "react";
import styled from "styled-components";

import Icon, { IconSize } from "components/ads/Icon";
import { createMessage } from "@appsmith/constants/messages";

type Props = {
  backgroundColor: string;
  className: string;
  icon: string;
  iconColor: string;
  iconSize: IconSize;
  message: () => string;
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
const MessageText = styled.p`
  padding-left: 4px;
  font-size: 13px;
  line-height: 16px;
  font-weight: 400;
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
      <MessageText>{createMessage(props.message)}</MessageText>
    </MessageContainer>
  );
}
