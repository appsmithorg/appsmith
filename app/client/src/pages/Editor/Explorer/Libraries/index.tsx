import React, { MutableRefObject, useCallback, useRef } from "react";
import styled from "styled-components";
import {
  Icon,
  IconSize,
  Spinner,
  Toaster,
  TooltipComponent,
  Variant,
} from "design-system-old";
import { Colors } from "constants/Colors";
import Entity, { EntityClassNames } from "../Entity";
import {
  createMessage,
  customJSLibraryMessages,
} from "@appsmith/constants/messages";
import { useDispatch, useSelector } from "react-redux";
import {
  selectInstallationStatus,
  selectIsInstallerOpen,
  selectLibrariesForExplorer,
} from "selectors/entitiesSelector";
import { InstallState } from "reducers/uiReducers/libraryReducer";
import { Collapse } from "@blueprintjs/core";
import { ReactComponent as CopyIcon } from "assets/icons/menu/copy-snippet.svg";
import useClipboard from "utils/hooks/useClipboard";
import {
  toggleInstaller,
  uninstallLibraryInit,
} from "actions/JSLibraryActions";
import EntityAddButton from "../Entity/AddButton";
import { TOOLTIP_HOVER_ON_DELAY } from "constants/AppConstants";
import { TJSLibrary } from "workers/common/JSLibrary";
import { getPagePermissions } from "selectors/editorSelectors";
import { hasCreateActionPermission } from "@appsmith/utils/permissionHelpers";
import recommendedLibraries from "./recommendedLibraries";
import { useTransition, animated } from "react-spring";

const docsURLMap = recommendedLibraries.reduce((acc, lib) => {
  acc[lib.url] = lib.docsURL;
  return acc;
}, {} as Record<string, string>);

const Library = styled.li`
  list-style: none;
  flex-direction: column;
  color: ${Colors.GRAY_700};
  font-weight: 400;
  display: flex;
  justify-content: space-between;
  cursor: pointer;
  position: relative;
  line-height: 17px;
  padding-left: 8px;

  > div:first-child {
    height: 36px;
  }

  .share {
    display: none;
    width: 30px;
    height: 36px;
    background: transparent;
    margin-left: 8px;
    flex-shrink: 0;
  }

  &:hover {
    background: ${Colors.SEA_SHELL};

    & .t--open-new-tab {
      display: block;
    }

    & .delete,
    .share {
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      &:hover {
        background: black;
        .uninstall-library,
        .open-link {
          color: white;
          svg > path {
            fill: white;
          }
        }
      }
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

  .delete {
    display: none;
    width: 30px;
    height: 36px;
    background: transparent;
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
    color: ${Colors.GRAY_700};
    display: flex;
    align-items: center;
    gap: 4px;
    width: 100%;
    overflow: hidden;
    .accessor {
      padding-left: 8px;
      flex-grow: 1;
      outline: 1px solid #b3b3b3 !important;
      font-size: 12px;
      font-family: monospace;
      background: white;
      display: flex;
      height: 25px;
      width: calc(100% - 80px);
      justify-content: space-between;
      align-items: center;
      color: ${Colors.ENTERPRISE_DARK};
      > div {
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: transparent;
        width: 25px;
        &: hover {
          background: ${Colors.SHARK2};
          > svg > path {
            fill: ${Colors.WHITE};
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
  margin: ${(props) => (props.version ? "0 8px" : "0")};
`;

const PrimaryCTA = function({ lib }: { lib: TJSLibrary }) {
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
        <Spinner size={IconSize.MEDIUM} />
      </div>
    );

  if (url) {
    //Default libraries will not have url
    return (
      <div className="delete" onClick={uninstallLibrary}>
        <Icon
          className="uninstall-library t--uninstall-library"
          name="trash-outline"
          size={IconSize.MEDIUM}
        />
      </div>
    );
  }

  return null;
};

function LibraryEntity({ lib }: { lib: TJSLibrary }) {
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
    Toaster.show({
      text: "Copied to clipboard",
      variant: Variant.success,
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
          fillColor={Colors.GREY_7}
          name="right-arrow-2"
          size={IconSize.XXXL}
        />
        <div className="flex items-center flex-start flex-1 overflow-hidden">
          <Name>{lib.name}</Name>
          {docsURL && (
            <div className="share" onClick={openDocs(docsURL)}>
              <Icon
                className="open-link"
                fillColor={Colors.GRAY_700}
                name="share-2"
                size={IconSize.SMALL}
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
        <div className="content pr-2">
          Available as{" "}
          <div className="accessor">
            {lib.accessor[lib.accessor.length - 1]}{" "}
            <div>
              <CopyIcon onClick={copyToClipboard} />
            </div>
          </div>
        </div>
      </Collapse>
    </Library>
  );
}

function JSDependencies() {
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

  const canCreateActions = hasCreateActionPermission(pagePermissions);

  const openInstaller = useCallback(() => {
    dispatch(toggleInstaller(true));
  }, []);

  return (
    <Entity
      className={"libraries"}
      customAddButton={
        <TooltipComponent
          boundary="viewport"
          className={EntityClassNames.TOOLTIP}
          content={createMessage(customJSLibraryMessages.ADD_JS_LIBRARY)}
          disabled={isOpen}
          hoverOpenDelay={TOOLTIP_HOVER_ON_DELAY}
          position="right"
        >
          <EntityAddButton
            className={`${EntityClassNames.ADD_BUTTON} group libraries h-100 ${
              isOpen ? "selected" : ""
            }`}
            onClick={openInstaller}
          />
        </TooltipComponent>
      }
      entityId="library_section"
      icon={null}
      isDefaultExpanded={isOpen}
      isSticky
      name="Libraries"
      showAddButton={canCreateActions}
      step={0}
    >
      {dependencyList}
    </Entity>
  );
}

export default React.memo(JSDependencies);
