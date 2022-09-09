import React from "react";
import { Colors } from "constants/Colors";
import styled from "styled-components";
import {
  Icon,
  IconSize,
  Text,
  Case,
  FontWeight,
  TextType,
} from "design-system";
import { Classes } from "components/ads/common";

const LinkText = styled.div<{ color?: string }>`
  cursor: pointer;
  .${Classes.ICON} {
    margin-left: ${(props) => props.theme.spaces[3]}px;
    display: inline-flex;
  }
  display: inline-flex;
  align-items: center;
  justify-content: center;
  &:hover {
    text-decoration: underline;
    text-decoration-color: ${(props) => props.color};
  }
`;

export default function Link({
  className = "",
  color,
  hasIcon = true,
  link,
  onClick,
  text,
}: {
  className?: string;
  color?: string;
  hasIcon?: boolean;
  link: string;
  onClick?: () => void;
  text: string;
}) {
  const clickHandler = () => {
    onClick ? onClick() : window.open(link, "_blank");
  };
  return (
    <LinkText
      className={className}
      color={color || Colors.CHARCOAL}
      onClick={clickHandler}
    >
      <Text
        case={Case.UPPERCASE}
        color={color || Colors.CHARCOAL}
        type={TextType.P3}
        weight={FontWeight.BOLD}
      >
        {text}
      </Text>
      {hasIcon && (
        <Icon
          fillColor={color || Colors.CHARCOAL}
          hoverFillColor={color || Colors.CHARCOAL}
          name="right-arrow"
          size={IconSize.SMALL}
        />
      )}
    </LinkText>
  );
}
