import React from "react";
import { Colors } from "constants/Colors";
import styled from "styled-components";
import Text, { Case, FontWeight, TextType } from "components/ads/Text";
import Icon, { IconSize } from "components/ads/Icon";
import { Classes } from "components/ads/common";

const LinkText = styled.div`
  cursor: pointer;
  .${Classes.ICON} {
    margin-left: ${(props) => props.theme.spaces[3]}px;
    display: inline-flex;
  }
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

export default function Link({ link, text }: { link: string; text: string }) {
  const onClick = () => {
    window.open(link, "_blank");
  };
  return (
    <LinkText onClick={onClick}>
      <Text
        case={Case.UPPERCASE}
        color={Colors.CHARCOAL}
        type={TextType.P3}
        weight={FontWeight.BOLD}
      >
        {text}
      </Text>
      <Icon name="right-arrow" size={IconSize.SMALL} />
    </LinkText>
  );
}
