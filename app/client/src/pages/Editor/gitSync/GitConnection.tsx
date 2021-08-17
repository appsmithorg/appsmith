import React from "react";
import { Subtitle, Title } from "./components/StyledComponents";
import {
  CONNECT_TO_GIT,
  CONNECT_TO_GIT_SUBTITLE,
  REMOTE_URL_VIA,
  createMessage,
} from "constants/messages";
import AuthTypeDropdown from "./components/AuthTypeDropdown";
import styled from "styled-components";
import { getTypographyByKey } from "constants/DefaultTheme";
import TextInput from "components/ads/TextInput";
import { ReactComponent as CheckIcon } from "assets/icons/ads/check.svg";
import { ReactComponent as LinkIcon } from "assets/icons/ads/link_2.svg";

const UrlOptionContainer = styled.div`
  ${(props) => getTypographyByKey(props, "h6")};
  display: flex;
  align-items: center;
  & .label {
    position: relative;
    top: 1px;
  }
`;

const CheckContainer = styled.div`
  display: flex;
  height: 100%;
  align-items: center;
  padding: ${(props) => props.theme.spaces[2]}px;
  padding-left: 0;
`;

const UrlContainer = styled.div`
  width: 30vw;
  display: flex;
  align-items: center;
`;

function GitConection() {
  return (
    <>
      <Title>{createMessage(CONNECT_TO_GIT)}</Title>
      <Subtitle>{createMessage(CONNECT_TO_GIT_SUBTITLE)}</Subtitle>
      <UrlOptionContainer>
        <span className="label">{`${createMessage(REMOTE_URL_VIA)} `}</span>
        <AuthTypeDropdown />
      </UrlOptionContainer>
      <UrlContainer>
        <TextInput
          fill
          rightSideComponent={
            <CheckContainer>
              <CheckIcon />
            </CheckContainer>
          }
        />
        <LinkIcon />
      </UrlContainer>
    </>
  );
}

export default GitConection;
