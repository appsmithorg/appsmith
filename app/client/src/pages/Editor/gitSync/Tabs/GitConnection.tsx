import React, { useState, useEffect, useRef } from "react";
import { Subtitle, Title, Space } from "../components/StyledComponents";
import {
  CONNECT_TO_GIT,
  CONNECT_TO_GIT_SUBTITLE,
  REMOTE_URL_VIA,
  createMessage,
  DEPLOY_KEY_USAGE_GUIDE_MESSAGE,
  DEPLOY_KEY_TITLE,
} from "constants/messages";
import styled from "styled-components";
import TextInput from "components/ads/TextInput";
import { ReactComponent as LinkSvg } from "assets/icons/ads/link_2.svg";
import UserGitProfileSettings from "../components/UserGitProfileSettings";
import { AUTH_TYPE_OPTIONS } from "../constants";
import { Colors } from "constants/Colors";
import Button, { Category, Size } from "components/ads/Button";
import { useGitConnect, useSSHKeyPair } from "../hooks";
import { ReactComponent as KeySvg } from "assets/icons/ads/key-2-line.svg";
import { ReactComponent as CopySvg } from "assets/icons/ads/file-copy-line.svg";
import { ReactComponent as TickSvg } from "assets/images/tick.svg";
import { Toaster } from "components/ads/Toast";
import { Variant } from "components/ads/common";
import { getCurrentUser } from "selectors/usersSelectors";
import { useDispatch, useSelector } from "react-redux";
import copy from "copy-to-clipboard";
import { getCurrentAppGitMetaData } from "selectors/applicationSelectors";
import Toggle from "components/ads/Toggle";
import Text, { TextType } from "components/ads/Text";
import { getGlobalGitConfig } from "selectors/gitSyncSelectors";
import { fetchGlobalGitConfigInit } from "actions/gitSyncActions";
import DirectDeploy from "../components/DirectDeploy";

export const UrlOptionContainer = styled.div`
  display: flex;
  align-items: center;

  & .primary {
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
  font-weight: 400;
  text-transform: uppercase;
  color: ${Colors.CODE_GRAY};
`;

const LintText = styled.a`
  :hover {
    text-decoration: none;
    color: ${Colors.CRUSTA};
  }
  color: ${Colors.CRUSTA};
  cursor: pointer;
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
`;

const Section = styled.div``;

// v1 only support SSH
const selectedAuthType = AUTH_TYPE_OPTIONS[0];
const HTTP_LITERAL = "https";

type Props = {
  onSuccess: () => void;
  isImport?: boolean;
};

function GitConnection({ isImport, onSuccess }: Props) {
  const { remoteUrl: remoteUrlInStore } =
    useSelector(getCurrentAppGitMetaData) || ({} as any);

  const [remoteUrl, setRemoteUrl] = useState<string>(remoteUrlInStore);
  // const [isValidRemoteUrl, setIsValidRemoteUrl] = useState(true);

  const currentUser = useSelector(getCurrentUser);

  const globalGitConfig = useSelector(getGlobalGitConfig);
  const dispatch = useDispatch();

  const [authorInfo, setAuthorInfo] = useState<{
    authorName: string;
    authorEmail: string;
  }>({
    authorName: currentUser?.name || "",
    authorEmail: currentUser?.email || "",
  });

  const [useGlobalConfig, setUseGlobalConfig] = useState(false);
  const [showCopied, setShowCopied] = useState(false);
  const timerRef = useRef(0);

  const {
    deployKeyDocUrl,
    failedGeneratingSSHKey,
    fetchingSSHKeyPair,
    fetchSSHKeyPair,
    generateSSHKey,
    generatingSSHKey,
    SSHKeyPair,
  } = useSSHKeyPair();

  const {
    connectToGit,
    failedConnectingToGit,
    isConnectingToGit,
  } = useGitConnect({ onSuccess });

  const stopShowingCopiedAfterDelay = () => {
    timerRef.current = setTimeout(() => {
      setShowCopied(false);
    }, 2000);
  };

  useEffect(() => {
    // On unmount clear timer to avoid memory leak
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const copyToClipboard = () => {
    if (SSHKeyPair) {
      copy(SSHKeyPair);
      setShowCopied(true);
      stopShowingCopiedAfterDelay();

      Toaster.show({
        text: "Copied SSH Key",
        variant: Variant.success,
      });
    }
  };

  const placeholderText = "Paste Your Git SSH URL";

  const gitConnectionRequest = () => {
    connectToGit({
      remoteUrl,
      gitProfile: authorInfo,
      isImport,
      isDefaultProfile: useGlobalConfig,
    });
  };

  useEffect(() => {
    // On mount check SSHKeyPair is defined, if not fetchSSHKeyPair
    if (!SSHKeyPair) {
      fetchSSHKeyPair();
    }
  }, [SSHKeyPair]);

  useEffect(() => {
    if (failedGeneratingSSHKey || failedConnectingToGit) {
      Toaster.show({
        text: "Something Went Wrong",
        variant: Variant.danger,
      });
    }
  }, [failedGeneratingSSHKey, failedConnectingToGit]);

  const remoteUrlChangeHandler = (value: string) => {
    setRemoteUrl(value);
  };

  const remoteUrlIsValid = (value: string) => value.startsWith(HTTP_LITERAL);

  const connectButtonDisabled =
    !authorInfo.authorEmail || !authorInfo.authorName;

  const isGlobalConfigDefined = !!(
    globalGitConfig.authorEmail && globalGitConfig.authorName
  );

  useEffect(() => {
    // when user has a git connected
    if (remoteUrl && SSHKeyPair && !isGlobalConfigDefined && false) {
      dispatch(fetchGlobalGitConfigInit());
    }
  }, [isGlobalConfigDefined]);

  const showDirectDeployOption = !SSHKeyPair && !remoteUrl;

  return (
    <Container>
      <Section>
        <Title>{createMessage(CONNECT_TO_GIT)}</Title>
        <Subtitle>{createMessage(CONNECT_TO_GIT_SUBTITLE)}</Subtitle>
        <UrlOptionContainer>
          <span>{createMessage(REMOTE_URL_VIA)}</span>
          <span className="primary">&nbsp;{selectedAuthType.label}</span>
        </UrlOptionContainer>
        <UrlContainer>
          <UrlInputContainer>
            <TextInput
              disabled={remoteUrl === remoteUrlInStore && !!remoteUrl}
              fill
              onChange={remoteUrlChangeHandler}
              placeholder={placeholderText}
              validator={(value) => ({
                isValid: true,
                message: remoteUrlIsValid(value)
                  ? "Please paste SSH URL of your repository"
                  : "",
              })}
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

        {!SSHKeyPair ? (
          remoteUrl && (
            <ButtonContainer topMargin={10}>
              <Button
                category={Category.secondary}
                disabled={!remoteUrl}
                isLoading={generatingSSHKey || fetchingSSHKeyPair}
                onClick={() => generateSSHKey()}
                size={Size.medium}
                tag="button"
                text="Generate SSH Key"
              />
            </ButtonContainer>
          )
        ) : (
          <>
            <FlexRow>
              <DeployedKeyContainer>
                <FlexRow>
                  <Flex>
                    <KeySvg />
                  </Flex>

                  <FlexColumn>
                    <LabelText>{createMessage(DEPLOY_KEY_TITLE)}</LabelText>
                    <KeyText>{SSHKeyPair}</KeyText>
                  </FlexColumn>
                </FlexRow>
              </DeployedKeyContainer>
              {showCopied ? (
                <Icon
                  color={Colors.GREEN}
                  hoverColor={Colors.GREEN}
                  marginOffset={4}
                  size="16px"
                >
                  <TickSvg />
                </Icon>
              ) : (
                <Icon
                  color={Colors.DARK_GRAY}
                  hoverColor={Colors.GRAY2}
                  marginOffset={3}
                  onClick={copyToClipboard}
                  size="22px"
                >
                  <CopySvg />
                </Icon>
              )}
            </FlexRow>
            <span>
              {createMessage(DEPLOY_KEY_USAGE_GUIDE_MESSAGE)}
              <LintText href={deployKeyDocUrl} target="_blank">
                &nbsp;Learn More
              </LintText>
            </span>
          </>
        )}
      </Section>

      {SSHKeyPair && remoteUrl ? (
        <>
          {isGlobalConfigDefined ? (
            <>
              <Space size={7} />
              <FlexRow>
                <Text className="" type={TextType.P1}>
                  Use Default Config
                </Text>
                <Space horizontal size={2} />
                <Toggle
                  onToggle={() => setUseGlobalConfig(!useGlobalConfig)}
                  value={useGlobalConfig}
                />
              </FlexRow>
            </>
          ) : null}

          <Space size={7} />
          <UserGitProfileSettings
            authType={selectedAuthType.label || ""}
            authorInfo={authorInfo}
            disabled={useGlobalConfig}
            setAuthorInfo={setAuthorInfo}
          />
          <ButtonContainer topMargin={11}>
            <Button
              disabled={connectButtonDisabled}
              isLoading={isConnectingToGit}
              onClick={gitConnectionRequest}
              size={Size.large}
              tag="button"
              text="CONNECT"
            />
            {/* <Text className="" type={TextType.P3}>
             // Show message when user config if modified
              User settings will be auto-saved.
            </Text> */}
          </ButtonContainer>
        </>
      ) : (
        showDirectDeployOption && <DirectDeploy />
      )}
    </Container>
  );
}

export default GitConnection;
