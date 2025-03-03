import type { MutableRefObject } from "react";
import React, { useCallback, useRef } from "react";
import styled from "styled-components";
import {
  Button,
  Icon,
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
  Spinner,
  toast,
  Tooltip,
} from "@appsmith/ads";
import Entity, { AddButtonWrapper, EntityClassNames } from "../Entity";
import { createMessage, customJSLibraryMessages } from "ee/constants/messages";
import { useDispatch, useSelector } from "react-redux";
import {
  selectInstallationStatus,
  selectIsInstallerOpen,
  selectLibrariesForExplorer,
} from "ee/selectors/entitiesSelector";
import { InstallState } from "reducers/uiReducers/libraryReducer";
import { Collapse } from "@blueprintjs/core";
import useClipboard from "utils/hooks/useClipboard";
import {
  clearInstalls,
  toggleInstaller,
  uninstallLibraryInit,
} from "actions/JSLibraryActions";
import EntityAddButton from "../Entity/AddButton";
import type { JSLibrary } from "workers/common/JSLibrary";
import {
  getCurrentPageId,
  getPagePermissions,
} from "selectors/editorSelectors";
import recommendedLibraries from "./recommendedLibraries";
import { useTransition, animated } from "react-spring";
import { isAirgapped } from "ee/utils/airgapHelpers";
import { Installer } from "./Installer";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import { getHasCreateActionPermission } from "ee/utils/BusinessFeatures/permissionPageHelpers";

const docsURLMap = recommendedLibraries.reduce(
  (acc, lib) => {
    acc[lib.url] = lib.docsURL;

    return acc;
  },
  {} as Record<string, string>,
);

const Library = styled.li`
  list-style: none;
  flex-direction: column;
  color: var(--ads-v2-color-fg);
  font-weight: 400;
  display: flex;
  justify-content: space-between;
  cursor: pointer;
  position: relative;
  line-height: 17px;
  padding-left: 8px;
  padding-right: 8px;

  > div:first-child {
    height: 36px;
  }

  &:hover {
    background: var(--ads-v2-color-bg-subtle);

    & .t--open-new-tab {
      display: block;
    }

    & .delete,
    .open-link {
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  .loading {
    display: none;
    width: 30px;
    height: 36px;
    background: transparent;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  & .t--open-new-tab {
    position: absolute;
    right: 8px;
    display: none;
  }

  .delete,
  .open-link {
    display: none;
    width: 30px;
    height: 36px;
    margin-left: 4px;
    /* background: transparent; */
    flex-shrink: 0;
  }

  & .t--package-version {
    display: block;
    font-size: 12px;
    height: 16px;
  }
  .open-collapse {
    transform: rotate(90deg);
  }

  .content {
    font-size: 12px;
    font-weight: 400;
    padding: 4px 8px;
    color: var(--ads-v2-color-fg);
    display: flex;
    align-items: center;
    gap: 4px;
    width: 100%;
    overflow: hidden;
    .accessor {
      padding-left: 8px;
      flex-grow: 1;
      outline: 1px solid var(--ads-v2-color-border) !important;
      font-size: 12px;
      font-family: monospace;
      background: white;
      display: flex;
      height: 25px;
      width: calc(100% - 80px);
      justify-content: space-between;
      align-items: center;
      color: var(--ads-v2-color-fg-emphasis);
      border-radius: var(--ads-v2-border-radius);
      > div {
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: transparent;
        width: 25px;
        &:hover {
          background: var(--ads-v2-color-bg-muted);
          > svg > path {
            fill: var(--ads-v2-color-fg);
          }
        }
      }
    }
  }
`;
const Name = styled.div`
  display: flex;
  align-items: center;
  line-height: 17px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  word-break: break-all;
`;
const Version = styled.div<{ version?: string }>`
  flex-shrink: 0;
  display: ${(props) => (props.version ? "block" : "none")};
  margin: ${(props) => (props.version ? "0 4px" : "0")};
`;

const PrimaryCTA = function ({ lib }: { lib: JSLibrary }) {
  const installationStatus = useSelector(selectInstallationStatus);
  const dispatch = useDispatch();

  const url = lib.url as string;

  const uninstallLibrary = useCallback(
    (e) => {
      e.stopPropagation();
      dispatch(uninstallLibraryInit(lib));
    },
    [lib],
  );

  if (installationStatus[url] === InstallState.Queued)
    return (
      <div className="loading">
        <Spinner size="md" />
      </div>
    );

  if (url) {
    //Default libraries will not have url
    return (
      <Button
        className="delete uninstall-library t--uninstall-library"
        isIconButton
        kind="error"
        onClick={uninstallLibrary}
        size="sm"
        startIcon="delete-bin-line"
      />
    );
  }

  return null;
};

export function LibraryEntity({ lib }: { lib: JSLibrary }) {
  const openDocs = useCallback(
    (url?: string) => (e: React.MouseEvent) => {
      e?.stopPropagation();
      url && window.open(url, "_blank");
    },
    [],
  );
  const propertyRef: MutableRefObject<HTMLDivElement | null> = useRef(null);
  const write = useClipboard(propertyRef);

  const copyToClipboard = useCallback(() => {
    write(lib.accessor[lib.accessor.length - 1]);
    toast.show("Copied to clipboard", {
      kind: "success",
    });
  }, [lib.accessor]);

  const [isOpen, open] = React.useState(false);
  const docsURL = docsURLMap[lib.url || ""] || lib.docsURL;

  return (
    <Library className={`t--installed-library-${lib.name}`}>
      <div
        className="flex flex-row items-center h-full"
        onClick={() => open(!isOpen)}
      >
        <Icon
          className={isOpen ? "open-collapse" : ""}
          name="right-arrow-2"
          size={"md"}
        />
        <div className="flex items-center flex-1 overflow-hidden flex-start">
          <Name>{lib.name}</Name>
          {docsURL && (
            <div className="share">
              <Button
                className="open-link"
                isIconButton
                kind="tertiary"
                onClick={openDocs(docsURL)}
                size="sm"
                startIcon="share-box-line"
              />
            </div>
          )}
        </div>
        <Version className="t--package-version" version={lib.version}>
          {lib.version}
        </Version>
        <PrimaryCTA lib={lib} />
      </div>
      <Collapse className="text-xs" isOpen={isOpen}>
        <div className="pr-2 content">
          Available as{" "}
          <div className="accessor">
            {lib.accessor[lib.accessor.length - 1]}{" "}
            <Button
              // className="open-link"
              isIconButton
              kind="tertiary"
              onClick={copyToClipboard}
              size="sm"
              startIcon="copy-control"
            />
          </div>
        </div>
      </Collapse>
    </Library>
  );
}

function JSDependencies() {
  const pageId = useSelector(getCurrentPageId) || "";
  const libraries = useSelector(selectLibrariesForExplorer);
  const transitions = useTransition(libraries, {
    keys: (lib) => lib.name,
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 1 },
  });
  const dependencyList = transitions((style, lib) => (
    <animated.div style={style}>
      <LibraryEntity lib={lib} />
    </animated.div>
  ));
  const isOpen = useSelector(selectIsInstallerOpen);
  const dispatch = useDispatch();

  const pagePermissions = useSelector(getPagePermissions);

  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);

  const canCreateActions = getHasCreateActionPermission(
    isFeatureEnabled,
    pagePermissions,
  );

  const isAirgappedInstance = isAirgapped();

  const openInstaller = useCallback(() => {
    dispatch(toggleInstaller(true));
  }, []);

  return (
    <Entity
      className={"group libraries"}
      customAddButton={
        <Popover
          onOpenChange={() => {
            dispatch(clearInstalls());
            dispatch(toggleInstaller(false));
          }}
          open={isOpen}
        >
          <Tooltip
            content={createMessage(customJSLibraryMessages.ADD_JS_LIBRARY)}
            isDisabled={isOpen}
            placement="right"
            {...(isOpen ? { visible: false } : {})}
          >
            <PopoverTrigger>
              <AddButtonWrapper>
                <EntityAddButton
                  className={`${
                    EntityClassNames.ADD_BUTTON
                  } group libraries h-100 ${isOpen ? "selected" : ""}`}
                  onClick={openInstaller}
                />
              </AddButtonWrapper>
            </PopoverTrigger>
          </Tooltip>
          <PopoverContent
            align="start"
            className="z-[25]"
            side="left"
            size="md"
          >
            <PopoverHeader className="sticky top-0" isClosable>
              {createMessage(customJSLibraryMessages.ADD_JS_LIBRARY)}
            </PopoverHeader>
            <PopoverBody className={"!overflow-y-clip"}>
              <Installer />
            </PopoverBody>
          </PopoverContent>
        </Popover>
      }
      entityId={pageId + "_library_section"}
      icon={null}
      isDefaultExpanded={isOpen}
      isSticky
      name="Libraries"
      showAddButton={canCreateActions && !isAirgappedInstance}
      step={0}
    >
      {dependencyList}
    </Entity>
  );
}

export default React.memo(JSDependencies);
