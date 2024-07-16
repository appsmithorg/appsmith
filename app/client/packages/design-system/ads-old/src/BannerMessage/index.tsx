import React from "react";
import styled from "styled-components";

import type { IconSize } from "../Icon";
import Icon from "../Icon";

interface Props {
  backgroundColor: string;
  className?: string;
  icon: string;
  iconColor: string;
  iconSize: IconSize;
  ctaChildren?: React.ReactNode;
  messageHeader?: string;
  message: string;
  textColor: string;
  fontWeight?: string;
  intentLine?: boolean;
  iconFlexPosition?: "start" | "center" | "end";
}

const MessageContainer = styled.div<{
  $backgroundColor: string;
  $iconColor: string;
  $intentLine: boolean;
  $textColor: string;
}>`
  display: flex;
  padding: 2px 8px;
  margin-bottom: 8px;
  flex-direction: row;
  color: ${(props) => props.$textColor};
  background: ${(props) => props.$backgroundColor};
  ${(props) =>
    props.$intentLine && `border-left: solid ${props.$iconColor} 2px;`}
  }
`;

const StyledIcon = styled(Icon)<{
  $iconFlexPosition?: "start" | "center" | "end";
}>`
  padding: 8px 4px;
  cursor: default;

  ${({ $iconFlexPosition }) =>
    $iconFlexPosition ? `align-items: ${$iconFlexPosition};` : ""}
  svg {
    cursor: default;
  }
`;

const MessageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding-left: 4px;
  padding-bottom: 8px;
  padding-top: 8px;
  line-height: 16px;
`;

const MessageText = styled.p<{
  $fontWeight?: string;
}>`
  font-size: 13px;
  font-weight: ${(props) => props.$fontWeight || `400`};
  margin-bottom: 0;
`;

const MessageHeader = styled.h2`
  font-size: 14px;
  font-weight: 600;
  padding-bottom: 5px;
  margin: 0;
`;

const CTAChild = styled.div`
  padding-top: 8px;
  display: flex;
`;

export function BannerMessage(props: Props) {
  return (
    <MessageContainer
      $backgroundColor={props.backgroundColor}
      $iconColor={props.iconColor}
      $intentLine={!!props.intentLine}
      $textColor={props.textColor}
      className={props.className}
    >
      <StyledIcon
        $iconFlexPosition={props.iconFlexPosition}
        fillColor={props.iconColor}
        name={props.icon}
        size={props.iconSize}
      />
      <MessageWrapper>
        {props.messageHeader && (
          <MessageHeader>{props.messageHeader}</MessageHeader>
        )}
        <MessageText $fontWeight={props.fontWeight}>
          {props.message}
        </MessageText>
        {props.ctaChildren && <CTAChild>{props.ctaChildren}</CTAChild>}
      </MessageWrapper>
    </MessageContainer>
  );
}
