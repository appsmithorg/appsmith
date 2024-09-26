import React, { useContext } from "react";
import { getInitialsAndColorCode } from "utils/AppsmithUtils";
import styled, { ThemeContext } from "styled-components";
import { Colors } from "constants/Colors";
import { Avatar } from "@appsmith/ads";

export const Profile = styled.div<{ backgroundColor?: string; size?: number }>`
  /* width: ${(props) => props.size || 34}px;
  height: ${(props) => props.size || 34}px;
  display: flex;
  align-items: center;
  border-radius: 50%;
  justify-content: center;
  cursor: pointer;
  background-color: ${(props) => props.backgroundColor};
  flex-shrink: 0;
  && span {
    color: ${Colors.BLACK};
    letter-spacing: normal;
  } */

  /* img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
  } */
`;

export default function ProfileImage(props: {
  userName?: string;
  className?: string;
  commonName?: string;
  size?: string;
  source?: string;
}) {
  const theme = useContext(ThemeContext);

  const initialsAndColorCode = getInitialsAndColorCode(
    props.commonName || props.userName,
    theme.colors.appCardColors,
  );

  return (
    <Avatar
      className={props.className}
      firstLetter={props.commonName || initialsAndColorCode[0]}
      image={props.source}
      label={props.commonName || initialsAndColorCode[0]}
      // @ts-expect-error Fix this the next time the file is edited
      size={props.size}
    />
  );
}
