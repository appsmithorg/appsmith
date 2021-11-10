import React, { useContext, useState } from "react";
import { getInitialsAndColorCode } from "utils/AppsmithUtils";
import Text, { TextType } from "components/ads/Text";
import styled, { ThemeContext } from "styled-components";
import { Colors } from "constants/Colors";

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
    color: ${Colors.BLACK};
    letter-spacing: normal;
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
  }
`;

export default function ProfileImage(props: {
  userName?: string;
  className?: string;
  commonName?: string;
  side?: number;
  source?: string;
}) {
  const theme = useContext(ThemeContext);

  const initialsAndColorCode = getInitialsAndColorCode(
    props.commonName || props.userName,
    theme.colors.appCardColors,
  );

  const [hasErrorLoadingImage, setHasErrorLoadingImage] = useState(false);

  const shouldRenderImage = props.source && !hasErrorLoadingImage;
  const backgroundColor = shouldRenderImage
    ? "transparent"
    : initialsAndColorCode[1];

  return (
    <Profile
      backgroundColor={backgroundColor}
      className={props.className}
      side={props.side} // side since it's a square
    >
      {!shouldRenderImage ? (
        <Text highlight type={TextType.H6}>
          {props.commonName || initialsAndColorCode[0]}
        </Text>
      ) : (
        <img
          onError={() => setHasErrorLoadingImage(true)}
          onLoad={() => setHasErrorLoadingImage(false)}
          src={props.source}
        />
      )}
    </Profile>
  );
}
