import React, { useState, MutableRefObject, useRef } from "react";
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
import Button, { Category, Size } from "components/ads/Button";
import { useParams } from "react-router";
import { ExplorerURLParams } from "pages/Editor/Explorer/helpers";
import { useSSHKeyPair } from "./hooks";
import { ReactComponent as KeySvg } from "assets/icons/ads/key-2-line.svg";
import { ReactComponent as CopySvg } from "assets/icons/ads/file-copy-line.svg";
import useClipboard from "utils/hooks/useClipboard";
import { Toaster } from "../../../components/ads/Toast";
import { Variant } from "components/ads/common";
import { getCurrentUser } from "selectors/usersSelectors";
import { useSelector } from "../../../store";

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

const ButtonContainer = styled.div<{ topMargin: number }>`
  margin-top: ${(props) => `${props.theme.spaces[props.topMargin]}px`};
`;

const Icon = styled.span<{
  size: string;
  color: string;
  marginOffset?: number;
}>`
  display: flex;
  justify-content: center;
  align-items: center;
  margin: ${(props) => `${props.theme.spaces[props.marginOffset || 0]}px`};
  cursor: pointer;
  svg {
    width: ${(props) => props.size};
    height: ${(props) => props.size};
    path {
      fill: ${(props) => props.color};
    }
  }
`;

const DeployedKeyContainer = styled.div`
  margin: 8px 0px;
  height: 50px;
  width: calc(100% - 30px);
  background-color: ${Colors.Gallery};
  padding: ${(props) =>
    `${props.theme.spaces[3]}px ${props.theme.spaces[4]}px`};
`;

const FlexColumn = styled.div`
  display: flex;
  flex-direction: column;
  width: 90%;
  margin-left: ${(props) => `${props.theme.spaces[4]}px`};
`;

const FlexRow = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
`;

const Flex = styled.div`
  display: flex;
`;

const LabelText = styled.span`
  font-size: 14px;
  color: ${Colors.CODE_GRAY};
`;

const KeyText = styled.span`
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  width: 100%;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  color: ${Colors.CODE_GRAY};
`;

// v1 only support SSH
const selectedAuthType = AUTH_TYPE_OPTIONS[0];

const appsmithGitSshURL = "git@github.com:appsmithorg/appsmith.git";

function GitConnection() {
  const [remoteUrl, setRemoteUrl] = useState<string>("");

  const { applicationId: currentApplicationId } = useParams<
    ExplorerURLParams
  >();

  const currentUser = useSelector(getCurrentUser);

  const propertyRef: MutableRefObject<HTMLDivElement | null> = useRef(null);
  const write = useClipboard(propertyRef);

  const {
    // failedGeneratingSSHKey,
    generateSSHKey,
    generatingSSHKey,
    sshKeyPair,
  } = useSSHKeyPair();

  const copyToClipboard = () => {
    if (sshKeyPair) {
      write(sshKeyPair);
      Toaster.show({
        text: "Copied SSH Key",
        variant: Variant.success,
      });
    }
  };

  const placeholderText = sshKeyPair
    ? appsmithGitSshURL
    : "Paste Your Git SSH URL";

  const showUnLinkIcon = remoteUrl || sshKeyPair;
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
            disabled={!!sshKeyPair}
            fill
            onChange={(value) => setRemoteUrl(value)}
            placeholder={placeholderText}
            value={remoteUrl}
          />
        </UrlInputContainer>
        {showUnLinkIcon ? (
          <Icon color={Colors.DARK_GRAY} size="22px">
            <LinkSvg />
          </Icon>
        ) : null}
      </UrlContainer>
      {!sshKeyPair ? (
        <ButtonContainer topMargin={4}>
          <Button
            category={Category.secondary}
            disabled={!remoteUrl}
            isLoading={generatingSSHKey}
            onClick={() => generateSSHKey(currentApplicationId)}
            size={Size.medium}
            tag="button"
            text="Generate SSH Key"
          />
        </ButtonContainer>
      ) : (
        <FlexRow>
          <DeployedKeyContainer>
            <FlexRow>
              <Flex>
                <KeySvg />
              </Flex>

              <FlexColumn>
                <LabelText>Deployed Key</LabelText>
                <KeyText>{sshKeyPair}</KeyText>
              </FlexColumn>
            </FlexRow>
          </DeployedKeyContainer>
          <Icon
            color={Colors.DARK_GRAY}
            marginOffset={3}
            onClick={copyToClipboard}
            size="22px"
          >
            <CopySvg />
          </Icon>
        </FlexRow>
      )}

      {sshKeyPair ? (
        <>
          <Space size={12} />
          <UserGitProfileSettings
            authType={selectedAuthType.label || ""}
            user={currentUser}
          />
          <ButtonContainer topMargin={11}>
            <Button size={Size.large} tag="button" text="CONNECT" />
          </ButtonContainer>
        </>
      ) : null}
    </>
  );
}

export default GitConnection;
