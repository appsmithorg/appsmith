import React, { MutableRefObject, useCallback, useRef } from "react";
import styled from "styled-components";
import { Icon, IconSize, Spinner, Toaster, Variant } from "design-system";
import { Colors } from "constants/Colors";
import Entity, { EntityClassNames } from "../Entity";
import {
  createMessage,
  CREATE_DATASOURCE_TOOLTIP,
} from "ce/constants/messages";
import InstallationWindow from "./InstallationWindow";
import { useDispatch, useSelector } from "react-redux";
import {
  selectInstallationStatus,
  selectLibrariesForExplorer,
} from "selectors/entitiesSelector";
import { InstallState } from "reducers/uiReducers/libraryReducer";
import { Collapse } from "@blueprintjs/core";
import { ReactComponent as CopyIcon } from "assets/icons/menu/copy-snippet.svg";
import useClipboard from "utils/hooks/useClipboard";
import { uninstallLibraryInit } from "actions/JSLibraryActions";

const Library = styled.li`
  list-style: none;
  flex-direction: column;
  color: ${Colors.GRAY_700};
  font-weight: 400;
  display: flex;
  justify-content: space-between;
  cursor: pointer;
  padding: 6px 12px 6px 0.5rem;
  position: relative;
  line-height: 17px;
  &:hover {
    background: ${Colors.ALABASTER_ALT};

    & .t--open-new-tab {
      display: block;
    }

    & .uninstall-library {
      display: block;
    }
  }

  & .t--open-new-tab {
    position: absolute;
    right: 8px;
    display: none;
  }

  & .uninstall-library {
    display: none;
  }

  & .t--package-version {
    display: block;
    font-size: 12px;
  }
  .open-collapse {
    transform: rotate(90deg);
  }

  .content {
    font-size: 12px;
    font-weight: 400;
    padding: 4px 0 0 8px;
    color: ${Colors.GRAY_700};
    display: flex;
    align-items: center;
    gap: 4px;
    .accessor {
      padding: 2px 8px;
      flex-grow: 1;
      border: 1px solid #b3b3b3;
      font-size: 12px;
      background: white;
      display: flex;
      height: 26px;
      justify-content: space-between;
      align-items: center;
      color: ${Colors.ENTERPRISE_DARK};
    }
  }
`;
const Name = styled.div`
  width: calc(100% - 36px);
  overflow: hidden;
  text-overflow: ellipsis;
  display: flex;
  align-items: center;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  word-break: break-all;
`;
const Version = styled.span<{ version?: string }>`
  display: ${(props) => (props.version ? "block" : "none")};
`;

const PrimaryCTA = function({ url }: { url: string }) {
  const installationStatus = useSelector(selectInstallationStatus);
  const dispatch = useDispatch();

  const uninstallLibrary = useCallback(() => {
    dispatch(uninstallLibraryInit(url));
  }, [url]);

  if (installationStatus[url] === InstallState.Queued)
    return (
      <div className="shrink-0">
        <Spinner />
      </div>
    );

  if (url) {
    //Default libraries will not have url
    return (
      <Icon
        className="uninstall-library ml-1"
        name="trash-outline"
        onClick={uninstallLibrary}
        size={IconSize.MEDIUM}
      />
    );
  }

  return null;
};

function LibraryEntity({ lib }: any) {
  const openDocs = (name: string, url: string) => () => window.open(url, name);
  const propertyRef: MutableRefObject<HTMLDivElement | null> = useRef(null);
  const write = useClipboard(propertyRef);

  const copyToClipboard = useCallback(() => {
    write(lib.accessor);
    Toaster.show({
      text: "Copied to clipboard",
      variant: Variant.success,
    });
  }, [lib.accessor]);

  const [isOpen, open] = React.useState(false);
  return (
    <Library>
      <div className="flex flex-row items-center">
        <Icon
          className={isOpen ? "open-collapse" : ""}
          fillColor={Colors.GREY_7}
          name="right-arrow-2"
          onClick={() => open(!isOpen)}
          size={IconSize.XXXL}
        />
        <Name>{lib.name}</Name>
        <Version
          className="t--package-version"
          onClick={openDocs(lib.name, lib.docsURL)}
          version={lib.version}
        >
          {lib.version}
        </Version>
        <PrimaryCTA url={lib.url as string} />
      </div>
      <Collapse className="text-xs" isOpen={isOpen}>
        <div className="content">
          Available as{" "}
          <div className="accessor">
            {lib.accessor} <CopyIcon onClick={copyToClipboard} />
          </div>
        </div>
      </Collapse>
    </Library>
  );
}

function JSDependencies() {
  const libraries = useSelector(selectLibrariesForExplorer);
  const dependencyList = libraries.map((lib) => (
    <LibraryEntity key={lib.name} lib={lib} />
  ));
  return (
    <Entity
      addButtonHelptext={createMessage(CREATE_DATASOURCE_TOOLTIP)}
      className={"libraries"}
      customAddButton={
        <InstallationWindow
          className={`${EntityClassNames.ADD_BUTTON} group libraries h-100`}
        />
      }
      entityId="library_section"
      icon={null}
      isDefaultExpanded={false}
      isSticky
      name="Libraries"
      searchKeyword={""}
      step={0}
    >
      {dependencyList}
    </Entity>
  );
}

export default React.memo(JSDependencies);
