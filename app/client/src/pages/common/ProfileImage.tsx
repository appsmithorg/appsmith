import React, { useContext } from "react";
import { getInitialsAndColorCode } from "utils/AppsmithUtils";
import Text, { TextType } from "components/ads/Text";
import styled, { ThemeContext } from "styled-components";

export const Profile = styled.div<{ backgroundColor?: string }>`
  width: 34px;
  height: 34px;
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
    >
      <Text type={TextType.H6} highlight>
        {props.commonName || initialsAndColorCode[0]}
      </Text>
    </Profile>
  );
}
