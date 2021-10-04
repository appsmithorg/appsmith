import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { Subtitle, Title, Space } from "../components/StyledComponents";
import {
  CONNECT_TO_GIT,
  CONNECT_TO_GIT_SUBTITLE,
  REMOTE_URL_VIA,
  createMessage,
  DEPLOY_KEY_USAGE_GUIDE_MESSAGE,
  DEPLOY_KEY_TITLE,
  REMOTE_URL_INPUT_PLACEHOLDER,
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
import { useDispatch, useSelector } from "react-redux";
import copy from "copy-to-clipboard";
import { getCurrentAppGitMetaData } from "selectors/applicationSelectors";
import Text, { TextType } from "components/ads/Text";
import { getGlobalGitConfig } from "selectors/gitSyncSelectors";
import {
  fetchGlobalGitConfigInit,
  fetchLocalGitConfigInit,
  updateLocalGitConfigInit,
} from "actions/gitSyncActions";
import DirectDeploy from "../components/DirectDeploy";
import TooltipComponent from "components/ads/Tooltip";
import { getLocalGitConfig } from "selectors/gitSyncSelectors";
import { GIT_DISCONNECT } from "constants/messages";
import { emailValidator } from "components/ads/TextInput";
import DisconnectGitConfirmPopup from "../components/DisconnectGitConfirmPopup";
import { disconnectToGitInit } from "actions/gitSyncActions";

export const UrlOptionContainer = styled.div`
  display: flex;
  align-items: center;

  & .primary {
  }
  margin-bottom: ${(props) => `${props.theme.spaces[1]}px`};
  margin-top: ${(props) => `${props.theme.spaces[7]}px`};
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

const TooltipWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
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
  const { remoteUrl: remoteUrlInStore = "" } =
    useSelector(getCurrentAppGitMetaData) || ({} as any);

  const [remoteUrl, setRemoteUrl] = useState(remoteUrlInStore);
  const [showDisconnectPopup, setShowDisconnectPopup] = useState(false);

  const isGitConnected = !!remoteUrlInStore;

  const globalGitConfig = useSelector(getGlobalGitConfig);
  const localGitConfig = useSelector(getLocalGitConfig);
  const isLocalConfigDefined = !!(
    localGitConfig.authorEmail || localGitConfig.authorName
  );

  const isGlobalConfigDefined = !!(
    globalGitConfig.authorEmail || globalGitConfig.authorName
  );

  const dispatch = useDispatch();

  const getInitGitConfig = () => {
    let initialAuthInfo = {
      authorName: "",
      authorEmail: "",
    };

    if (isLocalConfigDefined) {
      initialAuthInfo = {
        authorName: localGitConfig.authorName || "",
        authorEmail: localGitConfig.authorEmail || "",
      };
    }

    if (isGlobalConfigDefined) {
      initialAuthInfo = {
        authorName: globalGitConfig.authorName || "",
        authorEmail: globalGitConfig.authorEmail || "",
      };
    }

    return initialAuthInfo;
  };

  const initialAuthorInfoRef = useRef(getInitGitConfig());

  const [authorInfo, setAuthorInfo] = useState<{
    authorName: string;
    authorEmail: string;
  }>({
    authorName: initialAuthorInfoRef.current.authorName,
    authorEmail: initialAuthorInfoRef.current.authorEmail,
  });

  const [useGlobalConfig, setUseGlobalConfig] = useState(
    !isLocalConfigDefined && isGlobalConfigDefined,
  );
  const [showCopied, setShowCopied] = useState(false);
  const timerRef = useRef(0);

  const {
    deployKeyDocUrl,
    // failedGeneratingSSHKey,
    fetchingSSHKeyPair,
    fetchSSHKeyPair,
    generateSSHKey,
    generatingSSHKey,
    SSHKeyPair,
  } = useSSHKeyPair();

  const {
    connectToGit,
    // failedConnectingToGit,
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

  useEffect(() => {
    // when disconnected remoteURL becomes undefined
    if (!remoteUrlInStore) {
      setRemoteUrl("");
    }
  }, [remoteUrlInStore]);

  const placeholderText = createMessage(REMOTE_URL_INPUT_PLACEHOLDER);

  const isAuthorInfoUpdated = useCallback(() => {
    return (
      authorInfo.authorEmail !== initialAuthorInfoRef.current.authorEmail ||
      authorInfo.authorName !== initialAuthorInfoRef.current.authorName
    );
  }, [
    authorInfo.authorEmail,
    authorInfo.authorName,
    initialAuthorInfoRef.current.authorEmail,
    initialAuthorInfoRef.current.authorName,
  ]);

  const isRemoteUrlUpdated = () => {
    return remoteUrl !== remoteUrlInStore;
  };

  const onSubmit = () => {
    if (
      authorInfo.authorName &&
      authorInfo.authorEmail &&
      emailValidator(authorInfo.authorEmail).isValid
    ) {
      // Also check if useDefaultConfig switch is changed
      if (isGitConnected && !isRemoteUrlUpdated()) {
        if (isAuthorInfoUpdated()) {
          // just update local config
          dispatch(updateLocalGitConfigInit(authorInfo));
        }
      } else {
        connectToGit({
          remoteUrl,
          gitProfile: authorInfo,
          isImport,
          isDefaultProfile: useGlobalConfig,
        });
      }
    } else {
      Toaster.show({
        text: "Please enter valid user details",
      });
    }
  };

  useEffect(() => {
    // On mount check SSHKeyPair is defined, if not fetchSSHKeyPair
    if (!SSHKeyPair) {
      fetchSSHKeyPair();
    }
  }, [SSHKeyPair]);

  const remoteUrlChangeHandler = (value: string) => {
    setRemoteUrl(value);
  };

  const remoteUrlIsValid = useCallback(
    (value: string) => value.startsWith(HTTP_LITERAL),
    [],
  );

  const submitButtonDisabled = useMemo(
    () =>
      !authorInfo.authorEmail ||
      !authorInfo.authorName ||
      !emailValidator(authorInfo.authorEmail).isValid,
    [authorInfo.authorEmail, authorInfo.authorName],
  );

  useEffect(() => {
    // OnMount fetch global and local config
    dispatch(fetchGlobalGitConfigInit());
    dispatch(fetchLocalGitConfigInit());
  }, []);

  useEffect(() => {
    setAuthorInfo(localGitConfig);
  }, [localGitConfig.authorEmail, localGitConfig.authorName, setAuthorInfo]);

  const showDirectDeployOption = !SSHKeyPair && !remoteUrl;

  const toggleHandler = () => {
    setUseGlobalConfig(!useGlobalConfig);
  };

  const disconnectHandler = () => {
    dispatch(disconnectToGitInit());
  };

  const showDisconnectConfirmationPopup = () => {
    setShowDisconnectPopup(true);
  };

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
          {isGitConnected && (
            <TooltipComponent content={createMessage(GIT_DISCONNECT)}>
              <Icon
                color={Colors.DARK_GRAY}
                hoverColor={Colors.GRAY2}
                onClick={showDisconnectConfirmationPopup}
                size="22px"
              >
                <LinkSvg />
              </Icon>
            </TooltipComponent>
          )}
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
                <TooltipWrapper>
                  <TooltipComponent content="Copy Key">
                    <Icon
                      color={Colors.DARK_GRAY}
                      hoverColor={Colors.GRAY2}
                      marginOffset={3}
                      onClick={copyToClipboard}
                      size="22px"
                    >
                      <CopySvg />
                    </Icon>
                  </TooltipComponent>
                </TooltipWrapper>
              )}
            </FlexRow>
            <Text type={TextType.P3}>
              {createMessage(DEPLOY_KEY_USAGE_GUIDE_MESSAGE)}
              <LintText href={deployKeyDocUrl} target="_blank">
                &nbsp;Learn More
              </LintText>
            </Text>
          </>
        )}
      </Section>

      {SSHKeyPair && remoteUrl ? (
        <>
          <Space size={7} />
          <UserGitProfileSettings
            authType={selectedAuthType.label || ""}
            authorInfo={useGlobalConfig ? globalGitConfig : authorInfo}
            isGlobalConfigDefined={isGlobalConfigDefined}
            isLocalConfigDefined={isLocalConfigDefined}
            setAuthorInfo={setAuthorInfo}
            toggleUseDefaultConfig={toggleHandler}
            useGlobalConfig={useGlobalConfig}
          />
          <ButtonContainer topMargin={11}>
            <Button
              disabled={submitButtonDisabled}
              isLoading={isConnectingToGit}
              onClick={onSubmit}
              size={Size.large}
              tag="button"
              text={isGitConnected ? "UPDATE CONFIG" : "CONNECT"}
            />
          </ButtonContainer>
        </>
      ) : (
        showDirectDeployOption && <DirectDeploy />
      )}
      <DisconnectGitConfirmPopup
        isModalOpen={showDisconnectPopup}
        onClose={() => setShowDisconnectPopup(false)}
        onContinue={disconnectHandler}
      />
    </Container>
  );
}

export default GitConnection;
