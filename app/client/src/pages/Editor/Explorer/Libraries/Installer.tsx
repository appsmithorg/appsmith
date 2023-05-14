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
  Icon,
  toast,
  Text,
  Input,
  Link,
  Spinner,
  Divider,
  Avatar,
  Callout,
  Tooltip,
} from "design-system";
import {
  createMessage,
  customJSLibraryMessages,
} from "@appsmith/constants/messages";
import { useDispatch, useSelector } from "react-redux";
import {
  selectInstallationStatus,
  selectInstalledLibraries,
  selectIsInstallerOpen,
  selectIsLibraryInstalled,
  selectQueuedLibraries,
  selectStatusForURL,
} from "selectors/entitiesSelector";
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
import { EntityClassNames } from "pages/Editor/Explorer/Entity";

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
  padding: 0 20px 4px 22px;
  position: absolute;
  background: white;
  z-index: 25;
  left: ${(props) => props.left}px;
  bottom: 15px;
  border-radius: var(--ads-v2-border-radius);
  border-color: var(--ads-v2-color-border);
  box-shadow: var(--ads-v2-shadow-popovers);
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
    padding-left: 2px;
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
      a {
        display: inline-block;
        > span {
          font-size: inherit;
        }
        /* font-size: 12px; */
      }
    }
    .search-results {
      .library-card {
        gap: 8px;
        padding: 8px 0;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        border-bottom: 1px solid var(--ads-v2-color-border);
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
    .divider {
      margin: 0 0 16px 0;
    }
    .download {
      cursor: pointer;
    }
    .library-name {
      /* font-family: var(--font-family); */
      color: var(--ads-v2-color-fg-emphasis-plus);
      font-size: var(--ads-v2-font-size-6);
      font-weight: var(--ads-v2-h4-font-weight);
      letter-spacing: var(--ads-v2-h4-letter-spacing);
    }
  }
`;

const InstallationProgressWrapper = styled.div<{ addBorder: boolean }>`
  border-top: ${(props) =>
    props.addBorder ? `1px solid var(--appsmith-color-black-300)` : "none"};
  display: flex;
  flex-direction: column;
  background: var(--ads-v2-color-bg-muted);
  text-overflow: ellipsis;
  padding: 8px 8px 12px;
  border-radius: var(--ads-v2-border-radius);
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
      <Tooltip content="Successfully installed" trigger="hover">
        <Icon
          className="installed"
          color="var(--ads-v2-color-fg-success)"
          name="oval-check-fill"
          size="md"
        />
      </Tooltip>
    );
  if (status === InstallState.Failed)
    return (
      <Tooltip content="Download failed, please try again." trigger="hover">
        <Icon className="failed" name="warning-line" size="md" />
      </Tooltip>
    );
  if (status === InstallState.Queued) return <Spinner className="queued" />;
  return (
    <Tooltip content="Install" trigger="hover">
      <Button
        className="t--download download"
        isIconButton
        kind="tertiary"
        {...actionProps}
        size="sm"
        startIcon="download"
      />
    </Tooltip>
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
        {status === InstallState.Failed && (
          <Callout
            kind="error"
            links={[
              {
                children: createMessage(customJSLibraryMessages.REPORT_ISSUE),
                to: "#",
                onClick: (e) => openDoc(e, EXT_LINK.reportIssue),
              },
              {
                children: createMessage(customJSLibraryMessages.LEARN_MORE),
                onClick: (e) => openDoc(e, EXT_LINK.learnMore),
                to: "#",
              },
            ]}
          >
            <Banner />
          </Callout>
        )}
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
  const [errorMessage, setErrorMessage] = useState("");
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

    setErrorMessage(validate(value).message);
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
        toast.show(
          createMessage(
            customJSLibraryMessages.INSTALLED_ALREADY,
            libInstalled.accessor[0] || "",
          ),
          {
            kind: "info",
          },
        );
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
    <Wrapper
      className={`bp3-popover ${EntityClassNames.CONTEXT_MENU_CONTENT}`}
      left={left}
      ref={installerRef}
    >
      <div className="installation-header">
        <Text kind="heading-m">
          {createMessage(customJSLibraryMessages.ADD_JS_LIBRARY)}
        </Text>
        <Button
          className="t--close-installer"
          isIconButton
          kind="tertiary"
          onClick={closeInstaller}
          size="md"
          startIcon="close-line"
        />
      </div>
      <div className="search-body overflow-auto">
        <div className="search-area t--library-container">
          <div className="flex flex-row gap-2 justify-between items-end">
            <div className="w-full h-[83px]">
              <Input
                data-testid="library-url"
                errorMessage={errorMessage}
                isValid={isValid}
                label={"Library URL"}
                labelPosition="top"
                onChange={updateURL}
                placeholder="https://cdn.jsdelivr.net/npm/example@1.1.1/example.min.js"
                size="md"
                startIcon="link-2"
                type="text"
              />
            </div>

            <Button
              className="mb-[22px]"
              data-testid="install-library-btn"
              isDisabled={!(URL && isValid)}
              isLoading={queuedLibraries.length > 0}
              onClick={() => installLibrary()}
              size="md"
              startIcon="download"
            >
              Install
            </Button>
          </div>
        </div>
        <div className="search-CTA mb-3 text-xs">
          <span>
            Explore libraries on{" "}
            <Link
              kind="primary"
              onClick={(e) => openDoc(e, EXT_LINK.jsDelivr)}
              to="#"
            >
              jsDelivr
            </Link>
            {". "}
            {createMessage(customJSLibraryMessages.LEARN_MORE_DESC)}{" "}
            <Link
              kind="primary"
              onClick={(e) => openDoc(e, EXT_LINK.learnMore)}
              to="#"
            >
              here
            </Link>
            {"."}
          </span>
        </div>
        <Divider className="divider" />
        <InstallationProgress />
        <div className="pb-2 sticky top-0 z-2 bg-white">
          <Text kind="heading-xs">
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
        <div className="flex flex-row gap-1 items-center">
          <Link
            className="library-name"
            endIcon="share-box-line"
            kind="secondary"
            onClick={(e) => openDoc(e, lib.docsURL)}
            to="#"
          >
            {lib.name}
          </Link>
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
        <Avatar image={lib.icon} label={lib.author} size="sm" />
        <Text kind="action-s">{lib.author}</Text>
      </div>
    </div>
  );
}

export const Banner = () => {
  return (
    <div className="flex flex-col unsupported gap-1">
      <div className="header">
        {createMessage(customJSLibraryMessages.UNSUPPORTED_LIB)}
      </div>
      <div className="body">
        {createMessage(customJSLibraryMessages.UNSUPPORTED_LIB_DESC)}
      </div>
    </div>
  );
};
