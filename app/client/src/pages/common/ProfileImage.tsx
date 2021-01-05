import React from "react";
import { useSelector } from "react-redux";
import { getThemeDetails } from "selectors/themeSelectors";
import { getInitialsAndColorCode } from "utils/AppsmithUtils";
import Text, { TextType } from "components/ads/Text";
import styled from "styled-components";

export const Profile = styled.div<{ backgroundColor?: string }>`
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  border-radius: 50%;
  justify-content: center;
  cursor: pointer;
  background-color: ${(props) => props.backgroundColor};
`;

export default function ProfileImage(props: {
  userName?: string;
  className?: string;
  commonName?: string;
}) {
  const themeDetails = useSelector(getThemeDetails);

  const initialsAndColorCode = getInitialsAndColorCode(
    props.commonName || props.userName,
    themeDetails.theme.colors.appCardColors,
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
