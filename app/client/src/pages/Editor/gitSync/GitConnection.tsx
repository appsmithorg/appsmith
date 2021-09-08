import React, { useState } from "react";
import { Subtitle, Title, Space } from "./components/StyledComponents";
import {
  CONNECT_TO_GIT,
  CONNECT_TO_GIT_SUBTITLE,
  REMOTE_URL_VIA,
  createMessage,
} from "constants/messages";
import styled from "styled-components";
import TextInput from "components/ads/TextInput";
import { ReactComponent as LinkSvg } from "assets/icons/ads/link_2.svg";
import UserGitProfileSettings from "./components/UserGitProfileSettings";
import { AUTH_TYPE_OPTIONS } from "./constants";
import { Colors } from "constants/Colors";
import Button, { Size } from "components/ads/Button";

const UrlOptionContainer = styled.div`
  display: flex;
  align-items: center;

  & .primary {
    color: ${Colors.CRUSTA};
  }
  margin-bottom: 8px;
  margin-top: ${(props) => `${props.theme.spaces[2]}px`};
`;

const UrlContainer = styled.div`
  display: flex;
  align-items: center;
`;

const UrlInputContainer = styled.div`
  width: calc(100% - 30px);
  margin-right: 8px;
`;

const ButtonContainer = styled.div`
  margin-top: ${(props) => `${props.theme.spaces[13]}px`};
`;

const LinkIcon = styled.span<{ size: string }>`
  display: flex;
  justify-content: center;
  align-items: center;
  svg {
    width: ${(props) => props.size};
    height: ${(props) => props.size};
    path {
      fill: ${Colors.DARK_GRAY};
    }
  }
`;

// v1 only support SSH
const selectedAuthType = AUTH_TYPE_OPTIONS[0];

const appsmithGitSshURL = "git@github.com:appsmithorg/appsmith.git";

function GitConnection() {
  const [remoteUrl, setRemoteUrl] = useState<string>("");

  return (
    <>
      <Title>{createMessage(CONNECT_TO_GIT)}</Title>
      <Subtitle>{createMessage(CONNECT_TO_GIT_SUBTITLE)}</Subtitle>
      <UrlOptionContainer>
        <span>{createMessage(REMOTE_URL_VIA)}</span>
        <span className="primary">&nbsp;{selectedAuthType.label}</span>
      </UrlOptionContainer>
      <UrlContainer>
        <UrlInputContainer>
          <TextInput
            fill
            onChange={(value) => setRemoteUrl(value)}
            placeholder={appsmithGitSshURL}
            value={remoteUrl}
          />
        </UrlInputContainer>

        <LinkIcon size="22px">
          <LinkSvg />
        </LinkIcon>
      </UrlContainer>
      <Space size={12} />
      <UserGitProfileSettings authType={selectedAuthType.label || ""} />
      <ButtonContainer>
        <Button size={Size.large} tag="button" text="CONNECT" />
      </ButtonContainer>
    </>
  );
}

export default GitConnection;
