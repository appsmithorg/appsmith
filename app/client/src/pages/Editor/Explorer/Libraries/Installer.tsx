import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import styled from "styled-components";
import {
  Button,
  Category,
  FormGroup,
  Icon,
  IconSize,
  MenuDivider,
  Size,
  Spinner,
  Text,
  TextInput,
  TextType,
  Toaster,
  Variant,
} from "design-system-old";
import {
  createMessage,
  customJSLibraryMessages,
} from "@appsmith/constants/messages";
import ProfileImage from "pages/common/ProfileImage";
import { Colors } from "constants/Colors";
import { useDispatch, useSelector } from "react-redux";
import {
  selectInstallationStatus,
  selectInstalledLibraries,
  selectIsInstallerOpen,
  selectIsLibraryInstalled,
  selectQueuedLibraries,
  selectStatusForURL,
} from "selectors/entitiesSelector";
import SaveSuccessIcon from "remixicon-react/CheckboxCircleFillIcon";
import { InstallState } from "reducers/uiReducers/libraryReducer";
import recommendedLibraries from "pages/Editor/Explorer/Libraries/recommendedLibraries";
import type { AppState } from "@appsmith/reducers";
import {
  clearInstalls,
  installLibraryInit,
  toggleInstaller,
} from "actions/JSLibraryActions";
import classNames from "classnames";
import type { TJSLibrary } from "workers/common/JSLibrary";
import AnalyticsUtil from "utils/AnalyticsUtil";

const openDoc = (e: React.MouseEvent, url: string) => {
  e.preventDefault();
  e.stopPropagation();
  window.open(url, "_blank");
};

const Wrapper = styled.div<{ left: number }>`
  display: flex;
  height: auto;
  width: 400px;
  max-height: 80vh;
  flex-direction: column;
  padding: 0 20px 4px 24px;
  position: absolute;
  background: white;
  z-index: 25;
  left: ${(props) => props.left}px;
  bottom: 15px;
  .installation-header {
    padding: 20px 0 0;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    margin-bottom: 12px;
  }
  .search-body {
    display: flex;
    padding-right: 4px;
    flex-direction: column;
    .search-area {
      margin-bottom: 16px;
      .left-icon {
        margin-left: 14px;
        .cs-icon {
          margin-right: 0;
        }
      }
      .bp3-form-group {
        margin: 0;
        .remixicon-icon {
          cursor: initial;
        }
      }
      .bp3-label {
        font-size: 12px;
      }
      display: flex;
      flex-direction: column;
      .search-bar {
        margin-bottom: 8px;
      }
    }
    .search-CTA {
      margin-bottom: 16px;
      display: flex;
      flex-direction: column;
    }
    .search-results {
      .library-card {
        gap: 8px;
        padding: 8px 0;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        border-bottom: 1px solid var(--appsmith-color-black-100);
        .description {
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          font-size: 12px;
          line-clamp: 2;
          font-weight: 400;
          -webkit-box-orient: vertical;
        }
        img {
          cursor: initial;
        }
      }
      .library-card.no-border {
        border-bottom: none;
      }
    }
  }
`;

const InstallationProgressWrapper = styled.div<{ addBorder: boolean }>`
  border-top: ${(props) =>
    props.addBorder ? `1px solid var(--appsmith-color-black-300)` : "none"};
  display: flex;
  flex-direction: column;
  background: var(--appsmith-color-black-50);
  text-overflow: ellipsis;
  padding: 8px 8px 12px;
  .install-url {
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    word-break: break-all;
  }
  .error-card.show {
    display: flex;
  }
  .error-card {
    display: none;
    padding: 10px;
    flex-direction: row;
    background: #ffe9e9;
    .unsupported {
      line-height: 17px;
      .header {
        font-size: 13px;
        font-weight: 600;
        color: #393939;
      }
      .body {
        font-size: 12px;
        font-weight: 400;
      }
    }
  }
`;

const StatusIconWrapper = styled.div<{
  addHoverState: boolean;
}>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  cursor: initial;
  .failed {
    svg {
      cursor: initial;
    }
  }}
  ${(props) =>
    props.addHoverState
      ? `
    &:hover {
      cursor: pointer;
      background: ${Colors.SHARK2} !important;
      svg {
        path {
          fill: ${Colors.WHITE} !important;
        }
      }
    }
  `
      : "svg { cursor: initial }"}
`;

function isValidJSFileURL(url: string) {
  const JS_FILE_REGEX =
    /(?:https?):\/\/(\w+:?\w*)?(\S+)(:\d+)?(\/|\/([\w#!:.?+=&%!\-\/]))?/;
  return JS_FILE_REGEX.test(url);
}

function StatusIcon(props: {
  status: InstallState;
  isInstalled?: boolean;
  action?: any;
}) {
  const { action, isInstalled = false, status } = props;
  const actionProps = useMemo(
    () => (action ? { onClick: action } : {}),
    [action],
  );
  if (status === InstallState.Success || isInstalled)
    return (
      <StatusIconWrapper addHoverState={false} className="installed">
        <SaveSuccessIcon color={Colors.GREEN} size={18} />
      </StatusIconWrapper>
    );
  if (status === InstallState.Failed)
    return (
      <StatusIconWrapper addHoverState={false} className="failed">
        <Icon fillColor={Colors.GRAY} name="warning-line" size={IconSize.XL} />
      </StatusIconWrapper>
    );
  if (status === InstallState.Queued)
    return (
      <StatusIconWrapper addHoverState={false} className="queued">
        <Spinner />
      </StatusIconWrapper>
    );
  return (
    <StatusIconWrapper addHoverState className="t--download" {...actionProps}>
      <Icon fillColor={Colors.GRAY} name="download" size={IconSize.XL} />
    </StatusIconWrapper>
  );
}

function ProgressTracker({
  isFirst,
  isLast,
  status,
  url,
}: {
  isFirst: boolean;
  isLast: boolean;
  status: InstallState;
  url: string;
}) {
  return (
    <InstallationProgressWrapper
      addBorder={!isFirst}
      className={classNames({
        "mb-2": isLast,
        hidden: status !== InstallState.Failed,
      })}
    >
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-center gap-2 fw-500 text-sm">
          <div className="install-url text-sm font-medium">{url}</div>
          <div className="shrink-0">
            <StatusIcon status={status} />
          </div>
        </div>
        <div
          className={classNames({
            "gap-2 error-card items-start ": true,
            show: status === InstallState.Failed,
          })}
        >
          <Icon name="danger" size={IconSize.XL} />
          <div className="flex flex-col unsupported gap-1">
            <div className="header">
              {createMessage(customJSLibraryMessages.UNSUPPORTED_LIB)}
            </div>
            <div className="body">
              {createMessage(customJSLibraryMessages.UNSUPPORTED_LIB_DESC)}
            </div>
            <div className="footer text-xs font-medium gap-2 flex flex-row">
              <a onClick={(e) => openDoc(e, EXT_LINK.reportIssue)}>
                {createMessage(customJSLibraryMessages.REPORT_ISSUE)}
              </a>
              <a onClick={(e) => openDoc(e, EXT_LINK.learnMore)}>
                {createMessage(customJSLibraryMessages.LEARN_MORE)}
              </a>
            </div>
          </div>
        </div>
      </div>
    </InstallationProgressWrapper>
  );
}

function InstallationProgress() {
  const installStatusMap = useSelector(selectInstallationStatus);
  const urls = Object.keys(installStatusMap).filter(
    (url) => !recommendedLibraries.find((lib) => lib.url === url),
  );
  if (urls.length === 0) return null;
  return (
    <div>
      {urls.reverse().map((url, idx) => (
        <ProgressTracker
          isFirst={idx === 0}
          isLast={idx === urls.length - 1}
          key={`${url}_${idx}`}
          status={installStatusMap[url]}
          url={url}
        />
      ))}
    </div>
  );
}

const SectionDivider = styled(MenuDivider)`
  margin: 0 0 16px 0;
`;

const EXT_LINK = {
  learnMore:
    "https://docs.appsmith.com/core-concepts/writing-code/ext-libraries",
  reportIssue: "https://github.com/appsmithorg/appsmith/issues/19037",
  jsDelivr: "https://www.jsdelivr.com/",
};

export function Installer(props: { left: number }) {
  const { left } = props;
  const [URL, setURL] = useState("");
  const [isValid, setIsValid] = useState(true);
  const dispatch = useDispatch();
  const installedLibraries = useSelector(selectInstalledLibraries);
  const queuedLibraries = useSelector(selectQueuedLibraries);
  const isOpen = useSelector(selectIsInstallerOpen);
  const installerRef = useRef<HTMLDivElement>(null);

  const closeInstaller = useCallback(() => {
    setURL("");
    dispatch(clearInstalls());
    dispatch(toggleInstaller(false));
  }, []);

  const handleOutsideClick = useCallback((e: MouseEvent) => {
    const paths = e.composedPath();
    if (
      installerRef &&
      installerRef.current &&
      !paths?.includes(installerRef.current)
    )
      closeInstaller();
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen]);

  const updateURL = useCallback((value: string) => {
    setURL(value);
  }, []);

  const validate = useCallback((text) => {
    const isValid = !text || isValidJSFileURL(text);
    setIsValid(isValid);
    return {
      isValid,
      message: isValid ? "" : "Please enter a valid URL",
    };
  }, []);

  useEffect(() => {
    URL &&
      AnalyticsUtil.logEvent("EDIT_LIBRARY_URL", { url: URL, valid: isValid });
  }, [URL, isValid]);

  const installLibrary = useCallback(
    (lib?: Partial<TJSLibrary>) => {
      const url = lib?.url || URL;
      const isQueued = queuedLibraries.find((libURL) => libURL === url);
      if (isQueued) return;

      const libInstalled = installedLibraries.find((lib) => lib.url === url);
      if (libInstalled) {
        Toaster.show({
          text: createMessage(
            customJSLibraryMessages.INSTALLED_ALREADY,
            libInstalled.accessor[0] || "",
          ),
          variant: Variant.info,
        });
        return;
      }
      dispatch(
        installLibraryInit({
          url,
          name: lib?.name,
          version: lib?.version,
        }),
      );
    },
    [URL, installedLibraries, queuedLibraries],
  );

  return !isOpen ? null : (
    <Wrapper className="bp3-popover" left={left} ref={installerRef}>
      <div className="installation-header">
        <Text type={TextType.H1} weight={"bold"}>
          {createMessage(customJSLibraryMessages.ADD_JS_LIBRARY)}
        </Text>
        <Icon
          className="t--close-installer"
          fillColor={Colors.GRAY}
          name="close-modal"
          onClick={closeInstaller}
          size={IconSize.XXL}
        />
      </div>
      <div className="search-body overflow-auto">
        <div className="search-area t--library-container">
          <div className="flex flex-row gap-2 justify-between items-end">
            <FormGroup className="flex-1" label={"Library URL"}>
              <TextInput
                $padding="12px"
                data-testid="library-url"
                height="30px"
                label={"Library URL"}
                leftIcon="link-2"
                onChange={updateURL}
                padding="12px"
                placeholder="https://cdn.jsdelivr.net/npm/example@1.1.1/example.min.js"
                validator={validate}
                width="100%"
              />
            </FormGroup>
            <Button
              category={Category.primary}
              data-testid="install-library-btn"
              disabled={!(URL && isValid)}
              icon="download"
              isLoading={queuedLibraries.length > 0}
              onClick={() => installLibrary()}
              size={Size.medium}
              tag="button"
              text="INSTALL"
              type="button"
            />
          </div>
        </div>
        <div className="search-CTA mb-3 text-xs">
          <span>
            Explore libraries on{" "}
            <a
              className="text-primary-500"
              onClick={(e) => openDoc(e, EXT_LINK.jsDelivr)}
            >
              jsDelivr
            </a>
            {". "}
            {createMessage(customJSLibraryMessages.LEARN_MORE_DESC)}{" "}
            <a
              className="text-primary-500"
              onClick={(e) => openDoc(e, EXT_LINK.learnMore)}
            >
              here
            </a>
            {"."}
          </span>
        </div>
        <SectionDivider color="red" />
        <InstallationProgress />
        <div className="pb-2 sticky top-0 z-2 bg-white">
          <Text type={TextType.P1} weight={"600"}>
            {createMessage(customJSLibraryMessages.REC_LIBRARY)}
          </Text>
        </div>
        <div className="search-results">
          {recommendedLibraries.map((lib, idx) => (
            <LibraryCard
              isLastCard={idx === recommendedLibraries.length - 1}
              key={`${idx}_${lib.name}`}
              lib={lib}
              onClick={() => installLibrary(lib)}
            />
          ))}
        </div>
      </div>
    </Wrapper>
  );
}

function LibraryCard({
  isLastCard,
  lib,
  onClick,
}: {
  lib: (typeof recommendedLibraries)[0];
  onClick: (url: string) => void;
  isLastCard: boolean;
}) {
  const status = useSelector(selectStatusForURL(lib.url));
  const isInstalled = useSelector((state: AppState) =>
    selectIsLibraryInstalled(state, lib.url),
  );
  return (
    <div
      className={classNames({
        [`library-card t--${lib.name}`]: true,
        "no-border": isLastCard,
      })}
    >
      <div className="flex flex-row justify-between items-center">
        <div className="flex flex-row gap-2 items-center">
          <Text type={TextType.P0} weight="500">
            {lib.name}
          </Text>
          <StatusIconWrapper
            addHoverState
            onClick={(e) => openDoc(e, lib.docsURL)}
          >
            <Icon
              fillColor={Colors.GRAY}
              name="share-2"
              size={IconSize.SMALL}
            />
          </StatusIconWrapper>
        </div>
        <div className="mr-2">
          <StatusIcon
            action={onClick}
            isInstalled={isInstalled}
            status={status}
          />
        </div>
      </div>
      <div className="flex flex-row description">{lib.description}</div>
      <div className="flex flex-row items-center gap-1">
        <ProfileImage size={20} source={lib.icon} />
        <Text type={TextType.P3}>{lib.author}</Text>
      </div>
    </div>
  );
}
