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
} from "@appsmith/constants/messages";
import styled from "styled-components";
import TextInput from "components/ads/TextInput";
import UserGitProfileSettings from "../components/UserGitProfileSettings";
import { AUTH_TYPE_OPTIONS } from "../constants";
import { Colors } from "constants/Colors";
import Button, { Category, Size } from "components/ads/Button";
import { useGitConnect, useSSHKeyPair } from "../hooks";
import { useDispatch, useSelector } from "react-redux";
import copy from "copy-to-clipboard";
import {
  getCurrentAppGitMetaData,
  getCurrentApplication,
} from "selectors/applicationSelectors";
import Text, { TextType } from "components/ads/Text";
import {
  fetchGlobalGitConfigInit,
  fetchLocalGitConfigInit,
  remoteUrlInputValue,
  setDisconnectingGitApplication,
  setIsDisconnectGitModalOpen,
  setIsGitSyncModalOpen,
  updateLocalGitConfigInit,
} from "actions/gitSyncActions";
import { emailValidator } from "components/ads/TextInput";
import { isEqual } from "lodash";
import {
  UPDATE_CONFIG,
  CONNECT_BTN_LABEL,
  PASTE_SSH_URL_INFO,
  GENERATE_KEY,
} from "@appsmith/constants/messages";
import {
  getGlobalGitConfig,
  getIsFetchingGlobalGitConfig,
  getIsFetchingLocalGitConfig,
  // getIsGitSyncModalOpen,
  getLocalGitConfig,
  getRemoteUrlDocUrl,
  getTempRemoteUrl,
  getUseGlobalProfile,
} from "selectors/gitSyncSelectors";
import Statusbar, {
  StatusbarWrapper,
} from "pages/Editor/gitSync/components/Statusbar";
import ScrollIndicator from "components/ads/ScrollIndicator";
import DeployedKeyUI from "../components/DeployedKeyUI";
import GitConnectError from "../components/GitConnectError";
import Link from "../components/Link";
import TooltipComponent from "components/ads/Tooltip";
import Icon, { IconSize } from "components/ads/Icon";
import AnalyticsUtil from "utils/AnalyticsUtil";
// import { initSSHKeyPairWithNull } from "actions/applicationActions";

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
  position: relative;
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

const TooltipWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  right: -30px;
  top: 8px;
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
  const placeholderText = createMessage(REMOTE_URL_INPUT_PLACEHOLDER);

  const dispatch = useDispatch();
  const useGlobalProfile = useSelector(getUseGlobalProfile);
  const globalGitConfig = useSelector(getGlobalGitConfig);
  const localGitConfig = useSelector(getLocalGitConfig);
  const { tempRemoteUrl = "" } = useSelector(getTempRemoteUrl) || ({} as any);
  const curApplication = useSelector(getCurrentApplication);
  const isFetchingGlobalGitConfig = useSelector(getIsFetchingGlobalGitConfig);
  const isFetchingLocalGitConfig = useSelector(getIsFetchingLocalGitConfig);
  const { remoteUrl: remoteUrlInStore = "" } =
    useSelector(getCurrentAppGitMetaData) || ({} as any);
  // const isModalOpen = useSelector(getIsGitSyncModalOpen);

  const RepoUrlDocumentUrl = useSelector(getRemoteUrlDocUrl);

  const {
    deployKeyDocUrl,
    fetchingSSHKeyPair,
    fetchSSHKeyPair,
    generateSSHKey,
    generatingSSHKey,
    SSHKeyPair,
  } = useSSHKeyPair();

  const { connectToGit, isConnectingToGit } = useGitConnect();

  const [remoteUrl, setRemoteUrl] = useState(remoteUrlInStore || tempRemoteUrl);
  const isGitConnected = !!remoteUrlInStore;

  const [authorInfo, setAuthorInfo] = useState<AuthorInfo>({
    authorName: "",
    authorEmail: "",
  });
  const [useGlobalConfigInputVal, setUseGlobalConfigInputVal] = useState(false);

  const [triedSubmit, setTriedSubmit] = useState(false);
  const [isInvalidRemoteUrl, setIsValidRemoteUrl] = useState(false);
  const [showCopied, setShowCopied] = useState(false);
  const timerRef = useRef(0);

  useEffect(() => {
    // On unmount clear timer to avoid memory leak
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // when disconnected remoteURL becomes undefined
    if (!remoteUrlInStore) {
      setRemoteUrl(tempRemoteUrl || "");
    }
  }, [remoteUrlInStore]);

  useEffect(() => {
    const initialGlobalConfigInputVal = !isGitConnected
      ? true
      : useGlobalProfile;
    setUseGlobalConfigInputVal(!!initialGlobalConfigInputVal);
  }, [useGlobalProfile, isGitConnected]);

  useEffect(() => {
    setAuthorInfo(localGitConfig);
  }, [localGitConfig, useGlobalConfigInputVal]);

  useEffect(() => {
    // OnMount fetch global and local config
    dispatch(fetchGlobalGitConfigInit());
    dispatch(fetchLocalGitConfigInit());
  }, []);

  // init ssh key when close without git connection
  // useEffect(() => {
  //   if (!isModalOpen && !isGitConnected) {
  //     dispatch(initSSHKeyPairWithNull());
  //   }
  // }, [isModalOpen, isGitConnected]);

  useEffect(() => {
    // On mount check SSHKeyPair is defined, if not fetchSSHKeyPair
    if (!SSHKeyPair && isGitConnected) {
      fetchSSHKeyPair();
    }
  }, [SSHKeyPair]);

  const stopShowingCopiedAfterDelay = () => {
    timerRef.current = setTimeout(() => {
      setShowCopied(false);
    }, 2000);
  };

  const copyToClipboard = () => {
    if (SSHKeyPair) {
      copy(SSHKeyPair);
      setShowCopied(true);
      stopShowingCopiedAfterDelay();
    }
    AnalyticsUtil.logEvent("GS_COPY_SSH_KEY_BUTTON_CLICK");
  };

  const isAuthorInfoUpdated = useCallback(() => {
    return (
      !isEqual(localGitConfig?.authorEmail, authorInfo.authorEmail) ||
      !isEqual(localGitConfig?.authorName, authorInfo.authorName)
    );
  }, [authorInfo.authorEmail, authorInfo.authorName, localGitConfig]);

  const remoteUrlChangeHandler = (value: string) => {
    const isInvalid = remoteUrlIsInvalid(value);
    setIsValidRemoteUrl(isInvalid);
    setRemoteUrl(value);
    dispatch(remoteUrlInputValue({ tempRemoteUrl: value }));
    AnalyticsUtil.logEvent("GS_REPO_URL_EDIT", {
      repoUrl: value,
    });
  };

  const isUseGlobalProfileFlagUpdated =
    !!useGlobalConfigInputVal !== !!useGlobalProfile;

  const submitButtonDisabled = useMemo(() => {
    const isAuthInfoUpdated = isAuthorInfoUpdated();
    let buttonDisabled = false;
    if (isGitConnected) {
      const isFetchingConfig =
        isFetchingGlobalGitConfig || isFetchingLocalGitConfig;

      buttonDisabled =
        (!isAuthInfoUpdated && !isUseGlobalProfileFlagUpdated) ||
        isFetchingConfig;
    } else {
      buttonDisabled = isInvalidRemoteUrl;
    }
    return buttonDisabled;
  }, [
    isAuthorInfoUpdated,
    isGitConnected,
    isFetchingGlobalGitConfig,
    isFetchingLocalGitConfig,
    isInvalidRemoteUrl,
    isUseGlobalProfileFlagUpdated,
  ]);

  const submitButtonIsLoading = isConnectingToGit;

  const isAuthorInfoValid = useMemo(() => {
    return (
      useGlobalConfigInputVal ||
      (authorInfo.authorName &&
        authorInfo.authorEmail &&
        emailValidator(authorInfo.authorEmail).isValid)
    );
  }, [useGlobalConfigInputVal, authorInfo.authorName, authorInfo.authorEmail]);

  const onSubmit = useCallback(() => {
    if (isConnectingToGit || submitButtonDisabled) return;
    setTriedSubmit(true);
    AnalyticsUtil.logEvent("GS_CONNECT_BUTTON_ON_GIT_SYNC_MODAL_CLICK");
    if (!isAuthorInfoValid) return;

    if (isGitConnected) {
      const updatedGitConfig = useGlobalConfigInputVal
        ? localGitConfig
        : authorInfo;
      dispatch(
        updateLocalGitConfigInit({
          ...updatedGitConfig,
          useGlobalProfile: useGlobalConfigInputVal,
        }),
      );
    } else {
      connectToGit({
        remoteUrl,
        gitProfile: authorInfo,
        isImport,
        isDefaultProfile: useGlobalConfigInputVal,
      });
    }
  }, [
    updateLocalGitConfigInit,
    isAuthorInfoUpdated,
    connectToGit,
    useGlobalConfigInputVal,
    remoteUrl,
  ]);

  const toggleHandler = useCallback(() => {
    setUseGlobalConfigInputVal(!useGlobalConfigInputVal);
    AnalyticsUtil.logEvent("GS_DEFAULT_CONFIGURATION_CHECKBOX_TOGGLED", {
      value: !useGlobalConfigInputVal,
    });
  }, [setUseGlobalConfigInputVal, useGlobalConfigInputVal]);

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

  const openDisconnectGitModal = useCallback(() => {
    AnalyticsUtil.logEvent("GS_DISCONNECT_GIT_CLICK", {
      source: "GIT_CONNECTION_MODAL",
    });
    dispatch(setIsGitSyncModalOpen({ isOpen: false }));
    dispatch(
      setDisconnectingGitApplication({
        id: curApplication?.id || "",
        name: curApplication?.name || "",
      }),
    );
    dispatch(setIsDisconnectGitModalOpen(true));
  }, []);

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
              link={RepoUrlDocumentUrl || ""}
              onClick={() => {
                AnalyticsUtil.logEvent("GS_GIT_DOCUMENTATION_LINK_CLICK", {
                  source: "REMOTE_URL_ON_GIT_CONNECTION_MODAL",
                });
                window.open(RepoUrlDocumentUrl, "_blank");
              }}
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
            {isGitConnected && (
              <TooltipWrapper>
                <TooltipComponent content="Disconnect Git">
                  <Icon
                    fillColor={Colors.DARK_GRAY}
                    hoverFillColor={Colors.ERROR_RED}
                    name="delete"
                    onClick={openDisconnectGitModal}
                    size={IconSize.XXXXL}
                  />
                </TooltipComponent>
              </TooltipWrapper>
            )}
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
                onClick={() => {
                  generateSSHKey();
                  AnalyticsUtil.logEvent("GS_GENERATE_KEY_BUTTON_CLICK");
                }}
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
            authorInfo={useGlobalConfigInputVal ? globalGitConfig : authorInfo}
            setAuthorInfo={setAuthorInfo}
            toggleUseDefaultConfig={toggleHandler}
            triedSubmit={triedSubmit}
            useGlobalConfig={!!useGlobalConfigInputVal}
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
                category={Category.primary}
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
            {!isConnectingToGit && <GitConnectError onDisplay={scrolling} />}
          </ButtonContainer>
        </>
      ) : null}
      <ScrollIndicator containerRef={scrollWrapperRef} mode="DARK" top="47px" />
    </Container>
  );
}

export default GitConnection;
