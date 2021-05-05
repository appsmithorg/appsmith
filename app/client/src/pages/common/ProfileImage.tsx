import React, { useContext } from "react";
import { getInitialsAndColorCode } from "utils/AppsmithUtils";
import Text, { TextType } from "components/ads/Text";
import styled, { ThemeContext } from "styled-components";

export const Profile = styled.div<{ backgroundColor?: string; side?: number }>`
  width: ${(props) => props.side || 34}px;
  height: ${(props) => props.side || 34}px;
  display: flex;
  align-items: center;
  border-radius: 50%;
  justify-content: center;
  cursor: pointer;
  background-color: ${(props) => props.backgroundColor};
  && span {
    color: ${(props) => props.theme.colors.text.highlight};
  }
`;

export default function ProfileImage(props: {
  userName?: string;
  className?: string;
  commonName?: string;
  side?: number;
}) {
  const theme = useContext(ThemeContext);

  const initialsAndColorCode = getInitialsAndColorCode(
    props.commonName || props.userName,
    theme.colors.appCardColors,
  );

  return (
    <Profile
      backgroundColor={initialsAndColorCode[1]}
      className={props.className}
      side={props.side} // side since it's a square
    >
      <Text highlight type={TextType.H6}>
        {props.commonName || initialsAndColorCode[0]}
      </Text>
    </Profile>
  );
}
