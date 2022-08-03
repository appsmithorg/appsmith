import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Space, Subtitle, Title } from "../components/StyledComponents";
import {
  CONNECT_BTN_LABEL,
  CONNECT_TO_GIT,
  CONNECT_TO_GIT_SUBTITLE,
  CONNECTING_REPO,
  createMessage,
  GENERATE_KEY,
  IMPORT_BTN_LABEL,
  IMPORT_FROM_GIT_REPOSITORY,
  IMPORT_URL_INFO,
  IMPORTING_APP_FROM_GIT,
  LEARN_MORE,
  PASTE_SSH_URL_INFO,
  REMOTE_URL,
  REMOTE_URL_INFO,
  REMOTE_URL_INPUT_PLACEHOLDER,
  UPDATE_CONFIG,
} from "@appsmith/constants/messages";
import styled from "styled-components";
import TextInput, { emailValidator } from "components/ads/TextInput";
import UserGitProfileSettings from "../components/UserGitProfileSettings";
import { AUTH_TYPE_OPTIONS } from "../constants";
import { Colors } from "constants/Colors";
import Button, { Category, Size } from "components/ads/Button";
import { useDispatch, useSelector } from "react-redux";
import copy from "copy-to-clipboard";
import {
  getCurrentAppGitMetaData,
  getCurrentApplication,
} from "selectors/applicationSelectors";
import { Text, TextType } from "design-system";
import {
  fetchGlobalGitConfigInit,
  fetchLocalGitConfigInit,
  importAppFromGit,
  remoteUrlInputValue,
  resetSSHKeys,
  setDisconnectingGitApplication,
  setIsDisconnectGitModalOpen,
  setIsGitSyncModalOpen,
  updateLocalGitConfigInit,
} from "actions/gitSyncActions";
import { isEqual } from "lodash";
import {
  getGitConnectError,
  getGlobalGitConfig,
  getIsFetchingGlobalGitConfig,
  getIsFetchingLocalGitConfig,
  getIsImportingApplicationViaGit,
  getLocalGitConfig,
  getTempRemoteUrl,
  getUseGlobalProfile,
} from "selectors/gitSyncSelectors";
import Statusbar, {
  StatusbarWrapper,
} from "pages/Editor/gitSync/components/Statusbar";
import ScrollIndicator from "components/ads/ScrollIndicator";
import Keys from "../components/ssh-key";
import GitConnectError from "../components/GitConnectError";
import Link from "../components/Link";
import { TooltipComponent } from "design-system";
import Icon, { IconSize } from "components/ads/Icon";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { GIT_DOC_URLs, isValidGitRemoteUrl } from "../utils";
import { useGitConnect, useSSHKeyPair } from "../hooks";

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
  scrollbar-width: none;

  &::-webkit-scrollbar-thumb {
    background-color: transparent;
  }

  &::-webkit-scrollbar {
    width: 0;
  }
`;

const RemoteUrlInfoWrapper = styled.div`
  margin-bottom: ${(props) => props.theme.spaces[3]}px;
  display: flex;
`;

const Section = styled.div``;

const StickyMenuWrapper = styled.div`
  position: static;
  top: 0px;
  height: fit-content;
  z-index: 9999;
  background: white;
  margin-right: 10px;
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
  const currentApp = useSelector(getCurrentApplication);
  const isFetchingGlobalGitConfig = useSelector(getIsFetchingGlobalGitConfig);
  const isFetchingLocalGitConfig = useSelector(getIsFetchingLocalGitConfig);
  const { remoteUrl: remoteUrlInStore = "" } =
    useSelector(getCurrentAppGitMetaData) || ({} as any);
  const RepoUrlDocumentUrl = isImport
    ? GIT_DOC_URLs.import
    : GIT_DOC_URLs.connect;
  const isImportingApplicationViaGit = useSelector(
    getIsImportingApplicationViaGit,
  );
  const gitConnectError = useSelector(getGitConnectError);

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

  useEffect(() => {
    // On mount check SSHKeyPair is defined, if not fetchSSHKeyPair
    if (!SSHKeyPair && !isImport) {
      fetchSSHKeyPair();
    }
  }, []);

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
    const isInvalid = !isValidGitRemoteUrl(value);
    setIsValidRemoteUrl(isInvalid);
    setRemoteUrl(value);
    dispatch(remoteUrlInputValue({ tempRemoteUrl: value }));
    AnalyticsUtil.logEvent("GS_REPO_URL_EDIT", {
      repoUrl: value,
    });
  };

  const isUseGlobalProfileFlagUpdated =
    useGlobalConfigInputVal !== !!useGlobalProfile;

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
      isImport
        ? dispatch(
            importAppFromGit({
              payload: {
                remoteUrl,
                gitProfile: authorInfo,
                isDefaultProfile: useGlobalConfigInputVal,
              },
            }),
          )
        : connectToGit({
            remoteUrl,
            gitProfile: authorInfo,
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
  useEffect(() => {
    if (gitConnectError && scrollWrapperRef.current) {
      setTimeout(() => {
        const top = scrollWrapperRef.current?.scrollHeight || 0;
        scrollWrapperRef.current?.scrollTo({
          top: top,
        });
      }, 100);
    }
  }, [scrollWrapperRef, gitConnectError]);

  const openDisconnectGitModal = useCallback(() => {
    AnalyticsUtil.logEvent("GS_DISCONNECT_GIT_CLICK", {
      source: "GIT_CONNECTION_MODAL",
    });
    dispatch(setIsGitSyncModalOpen({ isOpen: false }));
    dispatch(
      setDisconnectingGitApplication({
        id: currentApp?.id || "",
        name: currentApp?.name || "",
      }),
    );
    dispatch(setIsDisconnectGitModalOpen(true));
  }, []);

  // reset on unmount
  useEffect(() => {
    return () => {
      dispatch(remoteUrlInputValue({ tempRemoteUrl: "" }));
      dispatch(resetSSHKeys());
    };
  }, []);

  return (
    <Container data-test="t--git-connection-container" ref={scrollWrapperRef}>
      <Section>
        <StickyMenuWrapper>
          <Title>
            {createMessage(
              isImport ? IMPORT_FROM_GIT_REPOSITORY : CONNECT_TO_GIT,
            )}
            <Subtitle>{createMessage(CONNECT_TO_GIT_SUBTITLE)}</Subtitle>
          </Title>
        </StickyMenuWrapper>
        <UrlOptionContainer data-test="t--remote-url-container">
          <Text color={Colors.GREY_9} type={TextType.P1}>
            {createMessage(REMOTE_URL)}
          </Text>
        </UrlOptionContainer>
        {!SSHKeyPair ? (
          <RemoteUrlInfoWrapper>
            <Text color={Colors.GREY_9} type={TextType.P3}>
              {createMessage(isImport ? IMPORT_URL_INFO : REMOTE_URL_INFO)}
            </Text>
            <Space horizontal size={1} />
            <Link
              className="t--learn-more-ssh-url"
              color={Colors.PRIMARY_ORANGE}
              hasIcon={false}
              link={RepoUrlDocumentUrl}
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
                    className="t--git-disconnect-icon"
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
            <ButtonContainer topMargin={7}>
              <Button
                category={Category.primary}
                className="t--generate-deploy-ssh-key-button t--submit-repo-url-button"
                data-testid="t--generate-deploy-ssh-key-button"
                disabled={!remoteUrl || isInvalidRemoteUrl}
                isLoading={generatingSSHKey || fetchingSSHKeyPair}
                onClick={() => {
                  generateSSHKey(
                    remoteUrl
                      .toString()
                      .toLocaleLowerCase()
                      .includes("azure")
                      ? "RSA"
                      : "ECDSA",
                  );
                  AnalyticsUtil.logEvent("GS_GENERATE_KEY_BUTTON_CLICK");
                }}
                size={Size.large}
                tag="button"
                text={createMessage(GENERATE_KEY)}
              />
            </ButtonContainer>
          )
        ) : (
          <Keys
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
            useGlobalConfig={useGlobalConfigInputVal}
          />
          <ButtonContainer topMargin={3}>
            {(isConnectingToGit || isImportingApplicationViaGit) && (
              <StatusbarWrapper className="t--connect-statusbar">
                <Statusbar
                  completed={
                    !submitButtonIsLoading && !isImportingApplicationViaGit
                  }
                  message={createMessage(
                    isImport ? IMPORTING_APP_FROM_GIT : CONNECTING_REPO,
                  )}
                  period={4}
                />
              </StatusbarWrapper>
            )}
            {!(isConnectingToGit || isImportingApplicationViaGit) && (
              <Button
                category={Category.primary}
                className="t--connect-submit-btn"
                disabled={submitButtonDisabled}
                isLoading={submitButtonIsLoading}
                onClick={onSubmit}
                size={Size.large}
                tag="button"
                text={
                  isImport
                    ? createMessage(IMPORT_BTN_LABEL)
                    : isGitConnected
                    ? createMessage(UPDATE_CONFIG)
                    : createMessage(CONNECT_BTN_LABEL)
                }
              />
            )}
            {!(isConnectingToGit || isImportingApplicationViaGit) && (
              <GitConnectError
                onClose={() => {
                  setRemoteUrl("");
                }}
              />
            )}
          </ButtonContainer>
        </>
      ) : null}
      <ScrollIndicator containerRef={scrollWrapperRef} mode="DARK" top="37px" />
    </Container>
  );
}

export default GitConnection;
