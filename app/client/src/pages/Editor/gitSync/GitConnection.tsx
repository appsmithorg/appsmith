import React, { useState, useEffect } from "react";
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
import { useGitConnect, useSSHKeyPair } from "./hooks";
import { ReactComponent as KeySvg } from "assets/icons/ads/key-2-line.svg";
import { ReactComponent as CopySvg } from "assets/icons/ads/file-copy-line.svg";
import { Toaster } from "components/ads/Toast";
import { Variant } from "components/ads/common";
import { getCurrentUser } from "selectors/usersSelectors";
import { useSelector } from "react-redux";
import { getCurrentOrgId } from "selectors/organizationSelectors";
import copy from "copy-to-clipboard";
import { getCurrentAppGitMetaData } from "selectors/applicationSelectors";

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
  hoverColor: string;
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
  &:hover {
    svg {
      path {
        fill: ${(props) => props.hoverColor};
      }
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

// const appsmithGitSshURL = "git@github.com:appsmithorg/appsmith.git";

type Props = {
  setActiveMenuIndex: (menuIndex: number) => void;
};

function GitConnection(props: Props) {
  const { remoteUrl: remoteUrlInStore } =
    useSelector(getCurrentAppGitMetaData) || ({} as any);

  const [remoteUrl, setRemoteUrl] = useState<string>(remoteUrlInStore);

  const { applicationId: currentApplicationId } = useParams<
    ExplorerURLParams
  >();

  const currentUser = useSelector(getCurrentUser);
  const orgId = useSelector(getCurrentOrgId);

  const [authorInfo, setAuthorInfo] = useState<{
    authorName: string;
    authorEmail: string;
  }>({
    authorName: currentUser?.name || "",
    authorEmail: currentUser?.email || "",
  });

  const {
    failedGeneratingSSHKey,
    generateSSHKey,
    generatingSSHKey,
    sshKeyPair,
  } = useSSHKeyPair();

  const {
    connectToGit,
    failedConnectingToGit,
    isConnectingToGit,
  } = useGitConnect({ goToDeploySection: () => props.setActiveMenuIndex(1) });

  const copyToClipboard = () => {
    if (sshKeyPair) {
      copy(sshKeyPair);
      Toaster.show({
        text: "Copied SSH Key",
        variant: Variant.success,
      });
    }
  };

  const placeholderText = "Paste Your Git SSH URL";

  const gitConnectionRequest = () => {
    connectToGit({
      applicationId: currentApplicationId,
      remoteUrl,
      gitConfig: authorInfo,
      organizationId: orgId,
    });
  };

  useEffect(() => {
    if (failedConnectingToGit || failedConnectingToGit) {
      Toaster.show({
        text: "Something Went Wrong",
        variant: Variant.danger,
      });
    }
  }, [failedGeneratingSSHKey, failedConnectingToGit]);

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
            disabled={remoteUrl === remoteUrlInStore && remoteUrl !== ""}
            fill
            onChange={(value) => setRemoteUrl(value)}
            placeholder={placeholderText}
            value={remoteUrl}
          />
        </UrlInputContainer>
        <Icon
          color={Colors.DARK_GRAY}
          hoverColor={Colors.GRAY2}
          onClick={() => setRemoteUrl("")}
          size="22px"
        >
          <LinkSvg />
        </Icon>
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
            hoverColor={Colors.GRAY2}
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
            authorInfo={authorInfo}
            setAuthorInfo={setAuthorInfo}
          />
          <ButtonContainer topMargin={11}>
            <Button
              isLoading={isConnectingToGit}
              onClick={gitConnectionRequest}
              size={Size.large}
              tag="button"
              text="CONNECT"
            />
          </ButtonContainer>
        </>
      ) : null}
    </>
  );
}

export default GitConnection;
