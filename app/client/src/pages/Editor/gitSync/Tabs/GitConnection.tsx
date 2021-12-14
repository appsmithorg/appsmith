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
  REMOTE_URL,
  REMOTE_URL_INFO,
  createMessage,
  REMOTE_URL_INPUT_PLACEHOLDER,
  CONNECTING_REPO,
  LEARN_MORE,
} from "constants/messages";
import styled from "styled-components";
import TextInput from "components/ads/TextInput";
import UserGitProfileSettings from "../components/UserGitProfileSettings";
import { AUTH_TYPE_OPTIONS } from "../constants";
import { Colors } from "constants/Colors";
import Button, { Category, Size } from "components/ads/Button";
import { useGitConnect, useSSHKeyPair, useUserGitConfig } from "../hooks";
import { useDispatch, useSelector } from "react-redux";
import copy from "copy-to-clipboard";
import { getCurrentAppGitMetaData } from "selectors/applicationSelectors";
import Text, { TextType } from "components/ads/Text";
import {
  fetchGlobalGitConfigInit,
  fetchLocalGitConfigInit,
  remoteUrlInputValue,
  updateLocalGitConfigInit,
} from "actions/gitSyncActions";
import { emailValidator } from "components/ads/TextInput";
import { isEqual } from "lodash";
import {
  UPDATE_CONFIG,
  CONNECT_BTN_LABEL,
  PASTE_SSH_URL_INFO,
  GENERATE_KEY,
} from "constants/messages";
import {
  getIsFetchingGlobalGitConfig,
  getIsFetchingLocalGitConfig,
  getTempRemoteUrl,
} from "selectors/gitSyncSelectors";
import Statusbar, {
  StatusbarWrapper,
} from "pages/Editor/gitSync/components/Statusbar";
import ScrollIndicator from "components/ads/ScrollIndicator";
import DeployedKeyUI from "../components/DeployedKeyUI";
import GitSyncError from "../components/GitSyncError";
import Link from "../components/Link";
import { DOCS_BASE_URL } from "constants/ThirdPartyConstants";

export const UrlOptionContainer = styled.div`
  display: flex;
  align-items: center;

  & .primary {
  }
  margin-bottom: ${(props) => `${props.theme.spaces[3]}px`};
  margin-top: ${(props) => `${props.theme.spaces[11]}px`};
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

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  &::-webkit-scrollbar-thumb {
    background-color: transparent;
  }
  &::-webkit-scrollbar {
    width: 0px;
  }
`;

const RemoteUrlInfoWrapper = styled.div`
  margin-bottom: ${(props) => props.theme.spaces[3]}px;
  display: flex;
`;

const Section = styled.div``;

const StickyMenuWrapper = styled.div`
  position: sticky;
  top: 0px;
  height: fit-content;
  z-index: 9999;
  background: white;
`;

// v1 only support SSH
const selectedAuthType = AUTH_TYPE_OPTIONS[0];
const HTTP_LITERAL = "https";

const SSH_INIT_FORMAT_REGEX = new RegExp(/^(ssh|.+@).*/);

const remoteUrlIsInvalid = (value: string) =>
  value.startsWith(HTTP_LITERAL) || !SSH_INIT_FORMAT_REGEX.test(value);

type AuthorInfo = {
  authorName: string;
  authorEmail: string;
};

type Props = {
  isImport?: boolean;
};

function GitConnection({ isImport }: Props) {
  const { remoteUrl: remoteUrlInStore = "" } =
    useSelector(getCurrentAppGitMetaData) || ({} as any);
  const { tempRemoteUrl = "" } = useSelector(getTempRemoteUrl) || ({} as any);

  const [remoteUrl, setRemoteUrl] = useState(remoteUrlInStore || tempRemoteUrl);
  const isGitConnected = !!remoteUrlInStore;
  const isFetchingGlobalGitConfig = useSelector(getIsFetchingGlobalGitConfig);
  const isFetchingLocalGitConfig = useSelector(getIsFetchingLocalGitConfig);
  const [triedSubmit, setTriedSubmit] = useState(false);

  const dispatch = useDispatch();

  const {
    getInitGitConfig,
    globalGitConfig,
    isGlobalConfigDefined,
    isLocalConfigDefined,
    localGitConfig,
  } = useUserGitConfig();

  const initialAuthorInfoRef = useRef(getInitGitConfig());

  const [authorInfo, setAuthorInfo] = useState<AuthorInfo>({
    authorName: initialAuthorInfoRef.current.authorName,
    authorEmail: initialAuthorInfoRef.current.authorEmail,
  });

  const [useGlobalConfig, setUseGlobalConfig] = useState(
    !isLocalConfigDefined && isGlobalConfigDefined,
  );

  const [isInvalidRemoteUrl, setIsValidRemoteUrl] = useState(false);
  const [showCopied, setShowCopied] = useState(false);
  const timerRef = useRef(0);

  const {
    deployKeyDocUrl,
    fetchingSSHKeyPair,
    fetchSSHKeyPair,
    generateSSHKey,
    generatingSSHKey,
    SSHKeyPair,
  } = useSSHKeyPair();

  const { connectToGit, isConnectingToGit } = useGitConnect();

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
    }
  };

  useEffect(() => {
    // when disconnected remoteURL becomes undefined
    if (!remoteUrlInStore) {
      setRemoteUrl(tempRemoteUrl || "");
    }
  }, [remoteUrlInStore]);

  const placeholderText = createMessage(REMOTE_URL_INPUT_PLACEHOLDER);

  const isAuthorInfoUpdated = useCallback(() => {
    return (
      !isEqual(
        authorInfo.authorEmail,
        initialAuthorInfoRef.current.authorEmail,
      ) ||
      !isEqual(authorInfo.authorName, initialAuthorInfoRef.current.authorName)
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

  const onSubmit = useCallback(() => {
    if (isConnectingToGit) return;
    setTriedSubmit(true);

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
        if (!isInvalidRemoteUrl) {
          connectToGit({
            remoteUrl,
            gitProfile: authorInfo,
            isImport,
            isDefaultProfile: useGlobalConfig,
          });
        }
      }
    }
  }, [
    updateLocalGitConfigInit,
    isAuthorInfoUpdated,
    isRemoteUrlUpdated,
    connectToGit,
    useGlobalConfig,
  ]);

  useEffect(() => {
    // On mount check SSHKeyPair is defined, if not fetchSSHKeyPair
    if (!SSHKeyPair) {
      fetchSSHKeyPair();
    }
  }, [SSHKeyPair]);

  const remoteUrlChangeHandler = (value: string) => {
    const isInvalid = remoteUrlIsInvalid(value);
    setIsValidRemoteUrl(isInvalid);
    setRemoteUrl(value);
    dispatch(remoteUrlInputValue({ tempRemoteUrl: value }));
  };

  const submitButtonDisabled = useMemo(() => {
    const isAuthInfoUpdated = isAuthorInfoUpdated();
    let buttonDisabled = false;
    if (isGitConnected) {
      const isFetchingConfig =
        isFetchingGlobalGitConfig || isFetchingLocalGitConfig;

      buttonDisabled = buttonDisabled || !isAuthInfoUpdated || isFetchingConfig;
    } else {
      buttonDisabled = isInvalidRemoteUrl;
    }
    return buttonDisabled;
  }, [
    authorInfo.authorEmail,
    authorInfo.authorName,
    isAuthorInfoUpdated,
    isGitConnected,
    isFetchingGlobalGitConfig,
    isFetchingLocalGitConfig,
    isInvalidRemoteUrl,
  ]);

  const submitButtonIsLoading = isConnectingToGit;

  useEffect(() => {
    // OnMount fetch global and local config
    dispatch(fetchGlobalGitConfigInit());
    dispatch(fetchLocalGitConfigInit());
  }, []);

  useEffect(() => {
    // on local config update
    const newAuthConfig = getInitGitConfig();
    setAuthorInfo(newAuthConfig);
    initialAuthorInfoRef.current = newAuthConfig;
  }, [
    localGitConfig.authorEmail,
    localGitConfig.authorName,
    setAuthorInfo,
    globalGitConfig.authorEmail,
    globalGitConfig.authorEmail,
  ]);

  const toggleHandler = useCallback(() => {
    setUseGlobalConfig(!useGlobalConfig);
  }, [setUseGlobalConfig, useGlobalConfig]);

  const scrollWrapperRef = React.createRef<HTMLDivElement>();

  const scrolling = useCallback(() => {
    if (scrollWrapperRef.current) {
      setTimeout(() => {
        const top = scrollWrapperRef.current?.scrollHeight || 0;
        scrollWrapperRef.current?.scrollTo({
          top: top,
          behavior: "smooth",
        });
      }, 100);
    }
  }, [scrollWrapperRef]);

  return (
    <Container ref={scrollWrapperRef}>
      <Section>
        <StickyMenuWrapper>
          <Title>{createMessage(CONNECT_TO_GIT)}</Title>
          <Subtitle>{createMessage(CONNECT_TO_GIT_SUBTITLE)}</Subtitle>
        </StickyMenuWrapper>
        <UrlOptionContainer>
          <Text color={Colors.GREY_9} type={TextType.P1}>
            {createMessage(REMOTE_URL)}
          </Text>
        </UrlOptionContainer>
        {!SSHKeyPair ? (
          <RemoteUrlInfoWrapper>
            <Text color={Colors.GREY_9} type={TextType.P3}>
              {createMessage(REMOTE_URL_INFO)}
            </Text>
            <Space horizontal size={1} />
            <Link
              color={Colors.PRIMARY_ORANGE}
              hasIcon={false}
              link={DOCS_BASE_URL}
              text={createMessage(LEARN_MORE)}
            />
          </RemoteUrlInfoWrapper>
        ) : null}
        <UrlContainer>
          <UrlInputContainer>
            <TextInput
              className="t--git-repo-input"
              disabled={remoteUrl === remoteUrlInStore && !!remoteUrl}
              errorMsg={
                isInvalidRemoteUrl ? createMessage(PASTE_SSH_URL_INFO) : ""
              }
              fill
              onChange={remoteUrlChangeHandler}
              placeholder={placeholderText}
              value={remoteUrl}
            />
          </UrlInputContainer>
        </UrlContainer>
        {!SSHKeyPair ? (
          remoteUrl &&
          !isInvalidRemoteUrl && (
            <ButtonContainer topMargin={10}>
              <Button
                category={Category.primary}
                className="t--submit-repo-url-button"
                isLoading={generatingSSHKey || fetchingSSHKeyPair}
                onClick={() => generateSSHKey()}
                size={Size.large}
                tag="button"
                text={createMessage(GENERATE_KEY)}
              />
            </ButtonContainer>
          )
        ) : (
          <DeployedKeyUI
            SSHKeyPair={SSHKeyPair || ""}
            copyToClipboard={copyToClipboard}
            deployKeyDocUrl={deployKeyDocUrl}
            showCopied={showCopied}
          />
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
            triedSubmit={triedSubmit}
            useGlobalConfig={useGlobalConfig}
          />
          <ButtonContainer topMargin={0}>
            {isConnectingToGit && (
              <StatusbarWrapper>
                <Statusbar
                  completed={!submitButtonIsLoading}
                  message={createMessage(CONNECTING_REPO)}
                  period={4}
                />
              </StatusbarWrapper>
            )}
            {!isConnectingToGit && (
              <Button
                category={
                  isGitConnected ? Category.secondary : Category.primary
                }
                className="t--connect-submit-btn"
                disabled={submitButtonDisabled}
                isLoading={submitButtonIsLoading}
                onClick={onSubmit}
                size={Size.large}
                tag="button"
                text={
                  isGitConnected
                    ? createMessage(UPDATE_CONFIG)
                    : createMessage(CONNECT_BTN_LABEL)
                }
              />
            )}
            {!isConnectingToGit && <GitSyncError onDisplay={scrolling} />}
          </ButtonContainer>
        </>
      ) : null}
      <ScrollIndicator containerRef={scrollWrapperRef} mode="DARK" top="47px" />
    </Container>
  );
}

export default GitConnection;
